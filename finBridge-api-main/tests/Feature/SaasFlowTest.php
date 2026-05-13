<?php

use Database\Seeders\InitialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use App\Models\User;

uses(RefreshDatabase::class);

test('mfi and entrepreneur can complete the core saas flow', function () {
    Storage::fake('public');

    $this->seed(InitialSeeder::class);

    $mfiRegistration = $this->postJson('/api/v1/auth/register/mfi', [
        'name' => 'Demo MFI Owner',
        'email' => 'owner@example.com',
        'phone' => '01711111111',
        'password' => 'password',
        'mfi_name' => 'Demo Microfinance',
        'mfi_email' => 'contact@example.com',
        'mfi_phone' => '01722222222',
    ])->assertCreated()
        ->assertJsonPath('success', true);

    $mfiToken = $mfiRegistration->json('data.token');
    $mfiId = $mfiRegistration->json('data.mfi_id');
    $mfiUser = User::where('email', 'owner@example.com')->firstOrFail();

    $this->postJson('/api/v1/auth/login', [
        'email' => 'owner@example.com',
        'password' => 'password',
    ])->assertOk()
        ->assertJsonPath('data.user.role', 'mfi_admin');

    $productId = $this->withToken($mfiToken)
        ->postJson('/api/v1/mfi/loan-products', [
            'name' => 'Small Business Loan',
            'min_amount' => 10000,
            'max_amount' => 50000,
            'interest_rate' => 12.5,
            'processing_fee' => 250,
            'duration_months' => 6,
            'description' => 'Working capital for small entrepreneurs.',
        ])->assertCreated()
        ->assertJsonPath('success', true)
        ->json('data.product_id');

    $this->getJson('/api/v1/loan-products')
        ->assertOk()
        ->assertJsonPath('data.0.id', $productId);

    $entrepreneurRegistration = $this->postJson('/api/v1/auth/register/entrepreneur', [
        'name' => 'Demo Entrepreneur',
        'email' => 'entrepreneur@example.com',
        'phone' => '01811111111',
        'password' => 'password',
    ])->assertCreated()
        ->assertJsonPath('success', true);

    expect($entrepreneurRegistration->json('data.token'))->toBeString();
    $entrepreneur = User::where('email', 'entrepreneur@example.com')->firstOrFail();

    $this->flushHeaders();

    Sanctum::actingAs($entrepreneur);

    $this->post('/api/v1/loan/apply', [
            'data' => json_encode([
                'mfi_id' => $mfiId,
                'loan_product_id' => $productId,
                'amount' => 20000,
                'duration_months' => 6,
                'purpose' => 'Inventory purchase',
            ]),
            'nid' => UploadedFile::fake()->create('nid.png', 100, 'image/png'),
        ])->assertCreated()
        ->assertJsonPath('success', true);

    $this->flushHeaders();

    Sanctum::actingAs($mfiUser);

    $this->getJson('/api/v1/mfi/applications')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('mfi can initiate a paid subscription checkout', function () {
    Http::fake([
        'sandbox.sslcommerz.com/*' => Http::response([
            'GatewayPageURL' => 'https://sandbox.sslcommerz.com/demo-checkout',
        ]),
    ]);

    $this->seed(InitialSeeder::class);

    $registration = $this->postJson('/api/v1/auth/register/mfi', [
        'name' => 'Payment Owner',
        'email' => 'payment-owner@example.com',
        'phone' => '01733333333',
        'password' => 'password',
        'mfi_name' => 'Payment MFI',
        'mfi_email' => 'payment@example.com',
        'mfi_phone' => '01744444444',
    ])->assertCreated();

    $proPlanId = DB::table('subscription_plans')->where('name', 'pro')->value('id');

    $this->withToken($registration->json('data.token'))
        ->postJson('/api/v1/subscription/subscribe', [
            'plan_id' => $proPlanId,
        ])->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('payment_url', 'https://sandbox.sslcommerz.com/demo-checkout');
});
