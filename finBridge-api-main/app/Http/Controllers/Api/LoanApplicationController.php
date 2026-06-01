<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Mail\LoanApplicationSubmitted;
use App\Mail\LoanApproved;
use App\Mail\LoanRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;

class LoanApplicationController extends Controller
{
    private function toInternalServiceUrl(string $url): string
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host'])) {
            return $url;
        }

        $host = strtolower((string) $parts['host']);
        $port = isset($parts['port']) ? (int) $parts['port'] : null;

        if (in_array($host, ['localhost', '127.0.0.1'], true)) {
            if ($port === 8000) {
                $url = preg_replace('/\/\/(localhost|127\.0\.0\.1):8000/i', '//loan-fraud-api:8000', $url) ?? $url;
            } elseif ($port === 9000) {
                $url = preg_replace('/\/\/(localhost|127\.0\.0\.1):9000/i', '//api:9000', $url) ?? $url;
            }
        }

        return $url;
    }

    private function saveNidVerification(string $applicationId, string $customerUniqueId, array $nidVerification): void
    {
        $detailsPayload = [
            'uploaded_image_url' => $nidVerification['uploaded_image_url'] ?? null,
            'reference_image_url' => $nidVerification['reference_image_url'] ?? null,
            'raw_text' => $nidVerification['raw_text'] ?? null,
            'message' => $nidVerification['message'] ?? null,
            'reference_found' => $nidVerification['reference_found'] ?? null,
        ];

        DB::table('nid_verifications')->updateOrInsert(
            ['loan_application_id' => $applicationId],
            [
                'id' => (string) Str::uuid(),
                'customer_unique_id' => $customerUniqueId,
                'verification_status' => (string) ($nidVerification['verification_status'] ?? 'not_verified'),
                'matched_reference' => (bool) ($nidVerification['matched_reference'] ?? false),
                'similarity_score' => isset($nidVerification['similarity_score']) ? (float) $nidVerification['similarity_score'] : null,
                'nid_number' => $nidVerification['nid_number'] ?? null,
                'extracted_name' => $nidVerification['extracted_name'] ?? null,
                'ocr_confidence' => isset($nidVerification['ocr_confidence']) ? (float) $nidVerification['ocr_confidence'] : null,
                'raw_text' => $nidVerification['raw_text'] ?? null,
                'details' => json_encode($detailsPayload),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    private function reverifyNidFromDocumentUrl(string $applicationId, string $customerUniqueId, string $nidUrl): ?array
    {
        try {
            $downloadUrl = $this->toInternalServiceUrl($nidUrl);
            $download = Http::timeout(12)->get($downloadUrl);
            if (!$download->ok()) {
                \Log::warning('NID reverify download failed', ['url' => $downloadUrl, 'status' => $download->status()]);
                return null;
            }

            $bytes = $download->body();
            if (!$bytes) {
                return null;
            }

            $name = basename(parse_url($nidUrl, PHP_URL_PATH) ?? 'nid.jpg');
            if ($name === '' || $name === '/' || $name === '\\') {
                $name = 'nid.jpg';
            }

            $url = env('FRAUD_API_NID_VERIFY_URL', 'http://loan-fraud-api:8000/nid/verify-upload');
            $mime = 'image/jpeg';
            if (function_exists('finfo_buffer')) {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $detected = $finfo->buffer($bytes);
                if (is_string($detected) && str_starts_with($detected, 'image/')) {
                    $mime = $detected;
                }
            }

            $response = Http::timeout(30)
                ->attach('file', $bytes, $name, ['Content-Type' => $mime])
                ->post($url, ['customer_unique_id' => $customerUniqueId]);

            if (!$response->ok()) {
                \Log::warning('NID reverify OCR call failed', ['url' => $url, 'status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $payload = $response->json() ?? [];
            $result = [
                'verification_status' => ((bool) ($payload['matched'] ?? false)) ? 'matched' : 'not_matched',
                'matched_reference' => (bool) ($payload['matched'] ?? false),
                'similarity_score' => isset($payload['similarity_score']) ? (float) $payload['similarity_score'] : null,
                'nid_number' => $payload['nid_number'] ?? null,
                'extracted_name' => $payload['extracted_name'] ?? null,
                'ocr_confidence' => isset($payload['ocr_confidence']) ? (float) $payload['ocr_confidence'] : null,
                'uploaded_image_url' => $payload['uploaded_image_url'] ?? null,
                'reference_image_url' => $payload['reference_image_url'] ?? null,
                'raw_text' => $payload['raw_text'] ?? null,
            ];

            $this->saveNidVerification($applicationId, $customerUniqueId, $result);
            return $result;
        } catch (\Throwable $e) {
            \Log::warning('NID reverify exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    private function toPublicDocumentUrl(string $filePath): string
    {
        $raw = trim($filePath);
        if ($raw === '') {
            return '';
        }
        $raw = str_replace('\\', '/', $raw);
        if (preg_match('/https?:\/\/.+/i', $raw, $m)) {
            return $m[0];
        }
        if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
            return $raw;
        }
        $base = rtrim((string) env('APP_URL', 'http://localhost:9000'), '/');
        $normalized = ltrim($raw, '/');
        if (str_starts_with($normalized, 'storage/')) {
            return $base . '/' . $normalized;
        }
        return $base . '/storage/' . $normalized;
    }

    private function verifyNidDocumentWithOcr(UploadedFile $nidFile, string $customerUniqueId): array
    {
        $url = env('FRAUD_API_NID_VERIFY_URL', 'http://loan-fraud-api:8000/nid/verify-upload');
        try {
            $mime = $nidFile->getMimeType() ?: 'image/jpeg';
            $response = Http::timeout(25)
                ->attach(
                    'file',
                    file_get_contents($nidFile->getRealPath()),
                    $nidFile->getClientOriginalName(),
                    ['Content-Type' => $mime]
                )
                ->post($url, ['customer_unique_id' => $customerUniqueId]);

            if (!$response->ok()) {
                return [
                    'success' => false,
                    'verification_status' => 'unavailable',
                    'message' => 'OCR service unavailable',
                ];
            }

            $payload = $response->json() ?? [];
            $matched = (bool) ($payload['matched'] ?? false);
            return [
                'success' => (bool) ($payload['success'] ?? true),
                'verification_status' => $matched ? 'matched' : 'not_matched',
                'matched_reference' => $matched,
                'similarity_score' => isset($payload['similarity_score']) ? (float) $payload['similarity_score'] : null,
                'nid_number' => $payload['nid_number'] ?? null,
                'extracted_name' => $payload['extracted_name'] ?? null,
                'ocr_confidence' => isset($payload['ocr_confidence']) ? (float) $payload['ocr_confidence'] : null,
                'uploaded_image_url' => $payload['uploaded_image_url'] ?? null,
                'reference_image_url' => $payload['reference_image_url'] ?? null,
                'raw_text' => $payload['raw_text'] ?? null,
                'message' => $payload['message'] ?? null,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'verification_status' => 'unavailable',
                'message' => 'OCR request failed',
            ];
        }
    }

    private function fetchGeminiReview(array $payload, float $fraudRate): ?string
    {
        if ($fraudRate < 40.0) {
            return null;
        }

        $url = env('FRAUD_API_EXPLAIN_URL', 'http://loan-fraud-api:8000/explain');

        try {
            $response = Http::timeout(6)->post($url, [
                'fraud_rate' => round($fraudRate, 2),
                'amount' => (float) ($payload['amount'] ?? 0),
                'duration_months' => (int) ($payload['duration_months'] ?? 0),
                'purpose' => (string) ($payload['purpose'] ?? ''),
                'description' => (string) ($payload['description'] ?? ''),
                'product_name' => (string) ($payload['product_name'] ?? ''),
            ]);

            if (!$response->ok()) {
                return null;
            }

            $review = $response->json('fraud_reason');
            return (is_string($review) && trim($review) !== '') ? trim($review) : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function persistRejectedLoanReview(string $applicationId, float $fraudRate, string $reviewReport, array $analysisPayload): void
    {
        $exists = DB::table('rejected_loan_application')
            ->where('loan_application_id', $applicationId)
            ->exists();

        if ($exists) {
            DB::table('rejected_loan_application')
                ->where('loan_application_id', $applicationId)
                ->update([
                    'fraud_rate' => round($fraudRate, 2),
                    'review_report' => $reviewReport,
                    'analysis_payload' => json_encode($analysisPayload),
                    'review_source' => 'gemini',
                    'updated_at' => now(),
                ]);
            return;
        }

        DB::table('rejected_loan_application')->insert([
            'id' => (string) Str::uuid(),
            'loan_application_id' => $applicationId,
            'fraud_rate' => round($fraudRate, 2),
            'review_report' => $reviewReport,
            'analysis_payload' => json_encode($analysisPayload),
            'review_source' => 'gemini',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function hydrateFraudReviewFromReport(object $application): void
    {
        $fraudScoreRaw = $application->fraud_score ?? null;
        if (!is_numeric($fraudScoreRaw)) {
            return;
        }

        $fraudScore = (float) $fraudScoreRaw;
        $fraudRate = $fraudScore <= 1.0 ? $fraudScore * 100.0 : $fraudScore;

        if ($fraudRate < 40.0) {
            return;
        }

        $existingReport = DB::table('rejected_loan_application')
            ->where('loan_application_id', $application->id)
            ->first();

        if ($existingReport && !empty($existingReport->review_report)) {
            $application->fraud_reason = $existingReport->review_report;
            return;
        }

        $payload = [
            'amount' => $application->amount ?? 0,
            'duration_months' => $application->duration_months ?? 0,
            'purpose' => $application->purpose ?? '',
            'description' => $application->description ?? '',
            'product_name' => $application->product_name ?? '',
        ];

        $review = $this->fetchGeminiReview($payload, $fraudRate);
        if (!$review) {
            return;
        }

        $this->persistRejectedLoanReview((string) $application->id, $fraudRate, $review, $payload);
        $application->fraud_reason = $review;
    }

    private function predictFraudScore(array $payload): array
    {
        $url = env('FRAUD_API_URL', 'http://loan-fraud-api:8000/predict');

        try {
            $response = Http::timeout(3)->post($url, $payload);
            if (!$response->ok()) {
                return ['score' => null, 'reason' => null];
            }

            $data = $response->json();
            $score = $data['fraud_probability']
                ?? $data['fraud_score']
                ?? $data['fraud_rate']
                ?? $data['probability']
                ?? $data['score']
                ?? null;

            if (!is_numeric($score)) {
                return ['score' => null, 'reason' => null];
            }

            $score = (float) $score;
            if ($score > 1.0 && $score <= 100.0) {
                $score = $score / 100.0;
            }

            return [
                'score' => max(0.0, min(1.0, $score)),
                'reason' => $data['fraud_reason'] ?? null,
            ];
        } catch (\Throwable $e) {
            return ['score' => null, 'reason' => null];
        }
    }

    private function storeApplicationDocument(Request $request, string $field): string
    {
        $storeLocally = function () use ($request, $field): string {
            $path = $request->file($field)->store('loan_documents', 'public');

            return Storage::disk('public')->url($path);
        };

        if (
            env('CLOUDINARY_CLOUD_NAME') &&
            env('CLOUDINARY_API_KEY') &&
            env('CLOUDINARY_API_SECRET')
        ) {
            try {
                $cloudinary = new Cloudinary([
                    'cloud' => [
                        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                        'api_key'    => env('CLOUDINARY_API_KEY'),
                        'api_secret' => env('CLOUDINARY_API_SECRET'),
                    ],
                ]);

                $upload = $cloudinary->uploadApi()->upload(
                    $request->file($field)->getRealPath(),
                    ['folder' => 'loan_documents']
                );

                return $upload['secure_url'];
            } catch (\Throwable $e) {
                \Log::warning('Cloudinary upload failed; storing application document locally.', [
                    'field' => $field,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $storeLocally();
    }

    public function apply(Request $request)
    {

        if ($request->has('data')) {
            $data = json_decode($request->data, true);

            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid JSON data',
                    'data' => null
                ], 400);
            }

            // merge into request
            $request->merge($data);
        }

        $request->validate([
            'mfi_id' => 'required|uuid',
            'loan_product_id' => 'required|uuid',
            'amount' => 'required|numeric|min:1',
            'duration_months' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'age' => 'nullable|integer|min:18|max:90',
            'income' => 'nullable|numeric|min:0',
            'credit_score' => 'nullable|integer|min:300|max:900',
            'employment_status' => 'nullable|string',
            'marital_status' => 'nullable|string',
            'education' => 'nullable|string',
            'property_area' => 'nullable|string',
            'dependents' => 'nullable|integer|min:0|max:20',
            'nid' => 'required|file|mimes:jpg,jpeg,png,webp|max:4096',
            'tax' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:4096',
            'tin' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:4096',
        ]);

        $user = $request->user();

        // ensure entrepreneur only
        if ($user->role !== 'entrepreneur') {
            return response()->json([
                'success' => false,
                'message' => 'Only entrepreneurs can apply',
                'data' => null
            ], 403);
        }

        // prevent duplicate application
        $existing = DB::table('loan_applications')
            ->where('user_id', $user->id)
            ->where('loan_product_id', $request->loan_product_id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already applied for this loan product',
                'data' => null
            ], 400);
        }

        // validate product
        $product = DB::table('loan_products')
            ->where('id', $request->loan_product_id)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid loan product',
                'data' => null
            ], 400);
        }

        // ensure product belongs to MFI
        if ($product->mfi_id !== $request->mfi_id) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid MFI and product mismatch',
                'data' => null
            ], 400);
        }

        $applicationId = (string) Str::uuid();
        $customerUniqueId = (string) $user->id;
        $nidVerification = $this->verifyNidDocumentWithOcr($request->file('nid'), $customerUniqueId);
        $prediction = $this->predictFraudScore([
            'loan_amount' => (float) $request->amount,
            'loan_term' => (int) $request->duration_months,
            'purpose' => (string) ($request->purpose ?? ''),
            'description' => (string) ($request->description ?? ''),
            'age' => (int) ($request->age ?? 30),
            'income' => (float) ($request->income ?? 25000),
            'credit_score' => (int) ($request->credit_score ?? 650),
            'employment_status' => (string) ($request->employment_status ?? 'Self-employed'),
            'marital_status' => (string) ($request->marital_status ?? 'Married'),
            'education' => (string) ($request->education ?? 'Secondary'),
            'property_area' => (string) ($request->property_area ?? 'Urban'),
            'dependents' => (int) ($request->dependents ?? 0),
        ]);
        $fraudScore = $prediction['score'];
        $fraudReason = $prediction['reason'];
        $isFraud = $fraudScore !== null && $fraudScore >= 0.7;
        $fraudRate = $fraudScore !== null ? ($fraudScore <= 1.0 ? $fraudScore * 100.0 : $fraudScore) : null;

        if (($fraudRate !== null && $fraudRate >= 40.0) && (empty($fraudReason) || !is_string($fraudReason))) {
            $fraudReason = $this->fetchGeminiReview([
                'amount' => (float) $request->amount,
                'duration_months' => (int) $request->duration_months,
                'purpose' => (string) ($request->purpose ?? ''),
                'description' => (string) ($request->description ?? ''),
                'product_name' => (string) ($product->name ?? ''),
            ], (float) $fraudRate);
        }

        DB::beginTransaction();

        try {
            // create application
            DB::table('loan_applications')->insert([
                'id' => $applicationId,
                'user_id' => $user->id,
                'mfi_id' => $request->mfi_id,
                'loan_product_id' => $request->loan_product_id,
                'amount' => $request->amount,
                'duration_months' => $request->duration_months,
                'purpose' => $request->purpose,
                'description' => $request->description ?? null,
                'status' => 'pending',
                'is_fraud' => $isFraud,
                'fraud_score' => $fraudScore ?? 0,
                'fraud_reason' => $fraudReason,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($fraudRate !== null && $fraudRate >= 40.0 && !empty($fraudReason)) {
                $this->persistRejectedLoanReview(
                    (string) $applicationId,
                    (float) $fraudRate,
                    (string) $fraudReason,
                    [
                        'amount' => (float) $request->amount,
                        'duration_months' => (int) $request->duration_months,
                        'purpose' => (string) ($request->purpose ?? ''),
                        'description' => (string) ($request->description ?? ''),
                        'product_name' => (string) ($product->name ?? ''),
                    ]
                );
            }

            $this->saveNidVerification((string) $applicationId, $customerUniqueId, $nidVerification);

            // NID (required)


            $nidUrl = is_string($nidVerification['uploaded_image_url'] ?? null) && $nidVerification['uploaded_image_url'] !== ''
                ? $nidVerification['uploaded_image_url']
                : $this->storeApplicationDocument($request, 'nid');

            DB::table('application_documents')->insert([
                'id' => (string) Str::uuid(),
                'loan_application_id' => $applicationId,
                'type' => 'nid',
                'file_path' => $nidUrl,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // tax (optional)
            if ($request->hasFile('tax')) {
                $path = $this->storeApplicationDocument($request, 'tax');

                DB::table('application_documents')->insert([
                    'id' => (string) Str::uuid(),
                    'loan_application_id' => $applicationId,
                    'type' => 'tax',
                    'file_path' => $path,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // tin (optional)
            if ($request->hasFile('tin')) {
                $path = $this->storeApplicationDocument($request, 'tin');

                DB::table('application_documents')->insert([
                    'id' => (string) Str::uuid(),
                    'loan_application_id' => $applicationId,
                    'type' => 'tin',
                    'file_path' => $path,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            // Mail::to($user->email)->send(
            //     new LoanApplicationSubmitted((object)[
            //         'id' => $applicationId,
            //         'amount' => $request->amount,
            //         'duration_months' => $request->duration_months,
            //         'user_name' => $user->name,
            //     ])
            // );

            // try {
            //     Mail::to($user->email)->send(
            //         new LoanApplicationSubmitted((object)[
            //             'id' => $applicationId,
            //             'amount' => $request->amount,
            //             'duration_months' => $request->duration_months,
            //             'user_name' => $user->name,
            //         ])
            //     );
            // } catch (\Exception $e) {
            //     \Log::error('Reject mail failed: ' . $e->getMessage());
            // }

            return response()->json([
                'success' => true,
                'message' => 'Loan application submitted',
                'data' => [
                    'application_id' => $applicationId,
                    'nid_verification' => [
                        'verification_status' => $nidVerification['verification_status'] ?? 'not_verified',
                        'matched_reference' => (bool) ($nidVerification['matched_reference'] ?? false),
                        'similarity_score' => $nidVerification['similarity_score'] ?? null,
                        'nid_number' => $nidVerification['nid_number'] ?? null,
                        'extracted_name' => $nidVerification['extracted_name'] ?? null,
                        'ocr_confidence' => $nidVerification['ocr_confidence'] ?? null,
                        'uploaded_image_url' => $nidVerification['uploaded_image_url'] ?? null,
                    ],
                ]
            ], 201);
        } catch (\Exception $e) {

            DB::rollBack();

            \Log::error('Loan application failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Application failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function mfiApplications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'mfi_admin' || !$user->mfi_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $all = filter_var($request->query('all', false), FILTER_VALIDATE_BOOLEAN);
        $hydrateAi = filter_var($request->query('hydrate_ai', true), FILTER_VALIDATE_BOOLEAN);
        $limit = (int) $request->query('limit', 10);
        if ($limit <= 0) {
            $limit = 10;
        }
        if ($all) {
            $limit = 50000;
        } elseif ($limit > 100) {
            $limit = 100;
        }

        $baseQuery = DB::table('loan_applications')
            ->join('users', 'loan_applications.user_id', '=', 'users.id')
            ->join('loan_products', 'loan_applications.loan_product_id', '=', 'loan_products.id')
            ->where('loan_applications.mfi_id', $user->mfi_id);

        if ($request->has('search')) {
            $baseQuery->where('users.name', 'like', '%' . $request->search . '%');
        }

        $stats = [
            'total' => (clone $baseQuery)->count('loan_applications.id'),
            'pending' => (clone $baseQuery)->where('loan_applications.status', 'pending')->count('loan_applications.id'),
            'approved' => (clone $baseQuery)->where('loan_applications.status', 'approved')->count('loan_applications.id'),
            'rejected' => (clone $baseQuery)->where('loan_applications.status', 'rejected')->count('loan_applications.id'),
        ];

        $query = clone $baseQuery;
        if ($request->has('status')) {
            $query->where('loan_applications.status', $request->status);
        }

        $applications = $query
            ->select(
                'loan_applications.id',
                'users.name as applicant_name',
                'users.email',
                'loan_products.name as product_name',
                'loan_applications.amount',
                'loan_applications.duration_months',
                'loan_applications.status',
                'loan_applications.description',
                'loan_applications.fraud_score',
                'loan_applications.fraud_reason',
                'loan_applications.created_at'
            )
            ->orderByDesc('loan_applications.created_at')
            ->limit($limit)
            ->get();
        
        if ($hydrateAi) {
            foreach ($applications as $application) {
                $this->hydrateFraudReviewFromReport($application);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'MFI applications fetched',
            'meta' => [
                'limit' => $limit,
                'returned' => $applications->count(),
                'stats' => $stats,
            ],
            'data' => $applications
        ]);
    }
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();

            $query = DB::table('loan_applications')
                ->join('users', 'loan_applications.user_id', '=', 'users.id')
                ->join('loan_products', 'loan_applications.loan_product_id', '=', 'loan_products.id')
                ->where('loan_applications.id', $id);

            // role-based access
            if ($user->role === 'mfi_admin') {
                $query->where('loan_applications.mfi_id', $user->mfi_id);
            } elseif ($user->role === 'entrepreneur') {
                $query->where('loan_applications.user_id', $user->id);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                    'data' => null
                ], 403);
            }

            $application = $query->select(
                'loan_applications.id',
                'loan_applications.user_id',
                'users.name as applicant_name',
                'users.email',
                'loan_products.name as product_name',
                'loan_applications.amount',
                'loan_applications.duration_months',
                'loan_applications.purpose',
                'loan_applications.description',
                'loan_applications.fraud_score',
                'loan_applications.fraud_reason',
                'loan_applications.status',
                'loan_applications.created_at'
            )->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found',
                    'data' => null
                ], 404);
            }
            
            $this->hydrateFraudReviewFromReport($application);

            // documents 
            $documentsRaw = DB::table('application_documents')
                ->where('loan_application_id', $id)
                ->get();
            $nidVerification = DB::table('nid_verifications')
                ->where('loan_application_id', $id)
                ->first();

            $documents = [];

            foreach ($documentsRaw as $doc) {
                $documents[] = [
                    'type' => $doc->type,
                    'file_path' => $doc->file_path,
                    'url' => $this->toPublicDocumentUrl((string) $doc->file_path),
                ];
            }

            if (!$nidVerification) {
                $nidDocument = collect($documents)->firstWhere('type', 'nid');
                if ($nidDocument && !empty($nidDocument['url'])) {
                    $this->reverifyNidFromDocumentUrl((string) $id, (string) $application->user_id, (string) $nidDocument['url']);
                    $nidVerification = DB::table('nid_verifications')
                        ->where('loan_application_id', $id)
                        ->first();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Application details fetched',
                'data' => [
                    'application' => $application,
                    'documents' => $documents,
                    'nid_verification' => $nidVerification ? [
                        'verification_status' => $nidVerification->verification_status,
                        'matched_reference' => (bool) $nidVerification->matched_reference,
                        'similarity_score' => $nidVerification->similarity_score !== null ? (float) $nidVerification->similarity_score : null,
                        'nid_number' => $nidVerification->nid_number,
                        'extracted_name' => $nidVerification->extracted_name,
                        'ocr_confidence' => $nidVerification->ocr_confidence !== null ? (float) $nidVerification->ocr_confidence : null,
                        'uploaded_image_url' => (json_decode($nidVerification->details ?? '{}', true)['uploaded_image_url'] ?? null),
                        'reference_image_url' => (json_decode($nidVerification->details ?? '{}', true)['reference_image_url'] ?? null),
                    ] : null,
                ]
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reverifyNid(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'mfi_admin' || !$user->mfi_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $application = DB::table('loan_applications')
            ->where('id', $id)
            ->where('mfi_id', $user->mfi_id)
            ->select('id', 'user_id')
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
            ], 404);
        }

        $nidDocument = DB::table('application_documents')
            ->where('loan_application_id', $id)
            ->where('type', 'nid')
            ->orderByDesc('created_at')
            ->first();

        if (!$nidDocument || empty($nidDocument->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'NID document not found',
            ], 404);
        }

        $nidUrl = $this->toPublicDocumentUrl((string) $nidDocument->file_path);
        $result = $this->reverifyNidFromDocumentUrl((string) $application->id, (string) $application->user_id, $nidUrl);
        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'NID re-verification failed',
            ], 500);
        }

        $saved = DB::table('nid_verifications')
            ->where('loan_application_id', $id)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'NID re-verified successfully',
            'data' => $saved ? [
                'verification_status' => $saved->verification_status,
                'matched_reference' => (bool) $saved->matched_reference,
                'similarity_score' => $saved->similarity_score !== null ? (float) $saved->similarity_score : null,
                'nid_number' => $saved->nid_number,
                'extracted_name' => $saved->extracted_name,
                'ocr_confidence' => $saved->ocr_confidence !== null ? (float) $saved->ocr_confidence : null,
            ] : $result,
        ]);
    }



    public function approve(Request $request, $id)
    {
        $user = $request->user();

        // ✅ role first
        if ($user->role !== 'mfi_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // ✅ subscription
        $subscription = $request->attributes->get('subscription');

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription missing'
            ], 403);
        }

        // ✅ trial limit
        if ($subscription->plan_name === 'trial') {

            $count = DB::table('loan_applications')
                ->where('mfi_id', $user->mfi_id)
                ->whereIn('status', ['approved', 'rejected'])
                ->count();

            if ($count >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trial limit reached (3 actions). Upgrade to Pro.'
                ], 403);
            }
        }



        $application = DB::table('loan_applications')
            ->where('id', $id)
            ->where('mfi_id', $user->mfi_id)
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
                'data' => null
            ], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Already processed',
                'data' => null
            ], 400);
        }

        DB::table('loan_applications')
            ->where('id', $id)
            ->update(['status' => 'approved']);

        $userData = DB::table('users')
            ->where('id', $application->user_id)
            ->first();

        if (!$userData) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'data' => null
            ], 404);
        }

        // try {
        //     Mail::to($userData->email)->send(
        //         new LoanApproved((object)[
        //             'id' => $application->id,
        //             'amount' => $application->amount,
        //             'user_name' => $userData->name,
        //         ])
        //     );
        // } catch (\Exception $e) {
        //     \Log::error('Mail failed: ' . $e->getMessage());
        // }

        return response()->json([
            'success' => true,
            'message' => 'Application approved',
        ]);
    }



    public function reject(Request $request, $id)
    {
        $user = $request->user();

        // ✅ role first
        if ($user->role !== 'mfi_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // ✅ subscription
        $subscription = $request->attributes->get('subscription');

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription missing'
            ], 403);
        }

        // ✅ trial limit
        if ($subscription->plan_name === 'trial') {

            $count = DB::table('loan_applications')
                ->where('mfi_id', $user->mfi_id)
                ->whereIn('status', ['approved', 'rejected'])
                ->count();

            if ($count >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trial limit reached (3 actions). Upgrade to Pro.'
                ], 403);
            }
        }


        // 🔍 find application
        $application = DB::table('loan_applications')
            ->where('id', $id)
            ->where('mfi_id', $user->mfi_id)
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
                'data' => null
            ], 404);
        }

        // 🚫 prevent re-processing
        if ($application->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Already processed',
                'data' => null
            ], 400);
        }

        // ❌ update status
        DB::table('loan_applications')
            ->where('id', $id)
            ->update([
                'status' => 'rejected',
                'updated_at' => now()
            ]);

        // 👤 get user
        $userData = DB::table('users')
            ->where('id', $application->user_id)
            ->first();

        if (!$userData) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'data' => null
            ], 404);
        }

        // 📧 send email safely
        // try {
        //     Mail::to($userData->email)->send(
        //         new LoanRejected((object)[
        //             'id' => $application->id,
        //             'user_name' => $userData->name,
        //         ])
        //     );
        // } catch (\Exception $e) {
        //     \Log::error('Reject mail failed: ' . $e->getMessage());
        // }

        return response()->json([
            'success' => true,
            'message' => 'Application rejected',

        ]);
    }


    public function myApplications(Request $request)
    {
        $user = $request->user();

        // ensure entrepreneur only
        if ($user->role !== 'entrepreneur') {
            return response()->json([
                'success' => false,
                'message' => 'Only entrepreneurs can access this',
            ], 403);
        }

        $applications = DB::table('loan_applications')
            ->join('loan_products', 'loan_applications.loan_product_id', '=', 'loan_products.id')
            ->join('mfi_institutions', 'loan_applications.mfi_id', '=', 'mfi_institutions.id')
            ->where('loan_applications.user_id', $user->id)
            ->select(
                'loan_applications.id',
                'loan_products.name as product_name',
                'mfi_institutions.name as mfi_name',
                'loan_applications.amount',
                'loan_applications.duration_months',
                'loan_applications.status',
                'loan_applications.created_at'
            )
            ->orderByDesc('loan_applications.created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Your applications fetched',
            'data' => $applications
        ]);
    }
    public function adminAll(Request $request)
    {
        $all = filter_var($request->query('all', false), FILTER_VALIDATE_BOOLEAN);
        $hydrateAi = filter_var($request->query('hydrate_ai', true), FILTER_VALIDATE_BOOLEAN);
        $limit = (int) $request->query('limit', 10);
        if ($limit <= 0) {
            $limit = 10;
        }
        if ($all) {
            $limit = 50000;
        } elseif ($limit > 100) {
            $limit = 100;
        }

        $baseQuery = DB::table('loan_applications')
            ->join('users', 'loan_applications.user_id', '=', 'users.id')
            ->join('mfi_institutions', 'loan_applications.mfi_id', '=', 'mfi_institutions.id');

        $stats = [
            'total' => (clone $baseQuery)->count('loan_applications.id'),
            'pending' => (clone $baseQuery)->where('loan_applications.status', 'pending')->count('loan_applications.id'),
            'approved' => (clone $baseQuery)->where('loan_applications.status', 'approved')->count('loan_applications.id'),
            'rejected' => (clone $baseQuery)->where('loan_applications.status', 'rejected')->count('loan_applications.id'),
        ];

        $applications = (clone $baseQuery)
            ->select(
                'loan_applications.id',
                'loan_applications.amount',
                'loan_applications.status',
                'loan_applications.fraud_score',
                'loan_applications.fraud_reason',
                'loan_applications.created_at',
                'users.name as borrower_name',
                'mfi_institutions.name as mfi_name'
            )
            ->orderByDesc('loan_applications.created_at')
            ->limit($limit)
            ->get();
        
        if ($hydrateAi) {
            foreach ($applications as $application) {
                $this->hydrateFraudReviewFromReport($application);
            }
        }

        return response()->json([
            'success' => true,
            'meta' => [
                'limit' => $limit,
                'returned' => $applications->count(),
                'stats' => $stats,
            ],
            'data' => $applications
        ]);
    }

    public function adminInsights(Request $request)
    {
        $threshold = 40.0;
        $fraudExpr = "(CASE WHEN loan_applications.fraud_score <= 1 THEN loan_applications.fraud_score * 100 ELSE loan_applications.fraud_score END)";

        $summary = DB::table('loan_applications')
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$threshold])
            ->selectRaw("AVG(COALESCE({$fraudExpr}, 0)) as avg_fraud_score")
            ->first();

        $mfiFraudRates = DB::table('loan_applications')
            ->join('mfi_institutions', 'loan_applications.mfi_id', '=', 'mfi_institutions.id')
            ->select('mfi_institutions.name as mfi_name')
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$threshold])
            ->selectRaw("ROUND((SUM(CASE WHEN {$fraudExpr} >= {$threshold} THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as fraud_rate")
            ->groupBy('mfi_institutions.name')
            ->orderByDesc('fraud_rate')
            ->limit(12)
            ->get();

        $dailyFraudTrend = DB::table('loan_applications')
            ->selectRaw("DATE(loan_applications.created_at) as day")
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$threshold])
            ->selectRaw('COUNT(*) as total_applications')
            ->where('loan_applications.created_at', '>=', now()->subDays(30))
            ->groupByRaw('DATE(loan_applications.created_at)')
            ->orderBy('day')
            ->get();

        $fraudByPurpose = DB::table('loan_applications')
            ->selectRaw("COALESCE(NULLIF(TRIM(loan_applications.purpose), ''), 'Unknown') as purpose")
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$threshold])
            ->whereRaw("{$fraudExpr} >= ?", [$threshold])
            ->groupByRaw("COALESCE(NULLIF(TRIM(loan_applications.purpose), ''), 'Unknown')")
            ->orderByDesc('fraud_applications')
            ->limit(10)
            ->get();

        $statusBreakdown = DB::table('loan_applications')
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw("ROUND(AVG(COALESCE({$fraudExpr}, 0)), 2) as avg_fraud_score")
            ->groupBy('status')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'threshold' => $threshold,
                'summary' => [
                    'total_applications' => (int) ($summary->total_applications ?? 0),
                    'fraud_applications' => (int) ($summary->fraud_applications ?? 0),
                    'avg_fraud_score' => round((float) ($summary->avg_fraud_score ?? 0), 2),
                ],
                'fraud_rate_by_mfi' => $mfiFraudRates,
                'daily_fraud_trend' => $dailyFraudTrend,
                'fraud_by_purpose' => $fraudByPurpose,
                'status_breakdown' => $statusBreakdown,
            ],
        ]);
    }
}
