<?php

return [

    /*
    |--------------------------------------------------------------------------
    | View Storage Paths
    |--------------------------------------------------------------------------
    |
    | Most applications typically only need one path for views. You may
    | change this if needed, but the default path is correct for Laravel.
    |
    */

    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled View Path
    |--------------------------------------------------------------------------
    |
    | Compiled Blade templates are stored in this directory.
    |
    */

    'compiled' => env('VIEW_COMPILED_PATH') ?: storage_path('framework/views'),

];
