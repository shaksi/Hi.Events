<?php

namespace HiEvents\Services\Domain\Payment\Waafi;

use Illuminate\Config\Repository;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\RequestException;
use Psr\Log\LoggerInterface;

readonly class WaafiPayHppService
{
    public function __construct(
        private LoggerInterface $logger,
        private Factory $httpClient,
        private Repository $config,
    ) {}

    /**
     * Initiate a WaafiPay HPP payment and return the redirect URL.
     *
     * @throws RequestException
     */
    public function initiatePayment(array $payload): string
    {
        $endpoint = $this->config->get('services.waafipay.endpoint');

        $payload['success_url'] = route('waafipay.success');
        $payload['cancel_url'] = route('waafipay.cancel');

        $response = $this->httpClient->post($endpoint, $payload);

        if ($response->failed()) {
            $this->logger->error('WaafiPay HPP request failed', [
                'payload' => $payload,
                'response' => $response->body(),
            ]);

            $response->throw();
        }

        return $response->json('payment_url');
    }
}
