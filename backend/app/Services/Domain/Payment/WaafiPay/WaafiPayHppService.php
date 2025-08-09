<?php

namespace HiEvents\Services\Domain\Payment\WaafiPay;

use GuzzleHttp\ClientInterface;
use Illuminate\Config\Repository;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;
use Throwable;

class WaafiPayHppService
{
    public function __construct(
        private readonly Repository $config,
        private readonly ClientInterface $httpClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    private function apiUrl(): string
    {
        return (string) $this->config->get('services.waafipay.api_url');
    }

    private function merchantUid(): string
    {
        return (string) $this->config->get('services.waafipay.merchant_uid');
    }

    private function storeId(): string
    {
        return (string) $this->config->get('services.waafipay.store_id');
    }

    private function hppKey(): string
    {
        return (string) $this->config->get('services.waafipay.hpp_key');
    }

    private function shouldLogRequests(): bool
    {
        return (bool) $this->config->get('services.waafipay.log_requests', false);
    }

    private function sendHppRequest(string $serviceName, array $params): array
    {
        $payload = [
            'schemaVersion' => '1.0',
            'requestId' => 'waafi_' . Str::uuid()->toString(),
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'channelName' => 'WEB',
            'serviceName' => $serviceName,
            'serviceParams' => $params,
        ];

        try {
            $response = $this->httpClient->request('POST', $this->apiUrl() . '/asm', [
                'json' => $payload,
            ]);

            return json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            if ($this->shouldLogRequests()) {
                $this->logger->error('WaafiPay request failed: ' . $exception->getMessage(), [
                    'service' => $serviceName,
                    'payload' => $payload,
                    'exception' => $exception,
                ]);
            }

            return ['error' => $exception->getMessage()];
        }
    }

    public function initiatePurchase(array $transaction): array
    {
        $params = [
            'merchantUid' => $this->merchantUid(),
            'storeId' => $this->storeId(),
            'hppKey' => $this->hppKey(),
            'paymentMethod' => 'CREDIT_CARD',
            'hppSuccessCallbackUrl' => url('/api/v1/waafipay/success'),
            'hppFailureCallbackUrl' => url('/api/v1/waafipay/fail'),
            'hppRespDataFormat' => $transaction['hppRespDataFormat'] ?? 4,
            'transactionInfo' => [
                'referenceId' => $transaction['referenceId'],
                'invoiceId' => $transaction['invoiceId'],
                'amount' => $transaction['amount'],
                'currency' => $transaction['currency'],
                'description' => $transaction['description'] ?? '',
            ],
        ];

        return $this->sendHppRequest('HPP_PURCHASE', $params);
    }

    public function refund(int $transactionId, float $amount, string $description = ''): array
    {
        $params = [
            'merchantUid' => $this->merchantUid(),
            'storeId' => $this->storeId(),
            'hppKey' => $this->hppKey(),
            'transactionId' => $transactionId,
            'amount' => $amount,
            'description' => $description,
        ];

        return $this->sendHppRequest('HPP_REFUNDPURCHASE', $params);
    }

    public function transactionInfo(string $referenceId): array
    {
        $params = [
            'merchantUid' => $this->merchantUid(),
            'storeId' => $this->storeId(),
            'hppKey' => $this->hppKey(),
            'referenceId' => $referenceId,
        ];

        return $this->sendHppRequest('HPP_GETTRANINFO', $params);
    }
}
