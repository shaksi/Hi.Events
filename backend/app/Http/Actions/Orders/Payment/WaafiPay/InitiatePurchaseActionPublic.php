<?php

namespace HiEvents\Http\Actions\Orders\Payment\WaafiPay;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Domain\Payment\WaafiPay\WaafiPayHppService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class InitiatePurchaseActionPublic extends BaseAction
{
    public function __construct(
        private readonly WaafiPayHppService $waafiPayService,
        private readonly OrderRepositoryInterface $orderRepository,
    ) {
    }

    public function __invoke(int $eventId, string $orderShortId): JsonResponse
    {
        $order = $this->orderRepository->findByShortId($orderShortId);

        if (!$order) {
            return $this->errorResponse(__('Order not found'), Response::HTTP_NOT_FOUND);
        }

        $transaction = [
            'referenceId' => $order->getShortId(),
            'invoiceId' => $order->getId(),
            'amount' => $order->getTotalGross(),
            'currency' => $order->getCurrency(),
            'description' => __('Payment for order :id', ['id' => $order->getShortId()]),
        ];

        $response = $this->waafiPayService->initiatePurchase($transaction);

        return $this->jsonResponse($response);
    }
}
