<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\WaafiPay;

use Psr\Log\LoggerInterface;

class IncomingWebhookHandler
{
    public function __construct(private readonly LoggerInterface $logger)
    {
    }

    public function handle(string $payload): void
    {
        $this->logger->info('WaafiPay webhook received', [
            'payload' => $payload,
        ]);
    }
}
