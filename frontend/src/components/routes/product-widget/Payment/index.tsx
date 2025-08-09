import React, {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useGetEventPublic} from "../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../layouts/Checkout/CheckoutContent";
import {StripePaymentMethod} from "./PaymentMethods/Stripe";
import {OfflinePaymentMethod} from "./PaymentMethods/Offline";
import {WaafiPayPaymentMethod} from "./PaymentMethods/WaafiPay";
import {Event, Order} from "../../../../types.ts";
import {CheckoutFooter} from "../../../layouts/Checkout/CheckoutFooter";
import {Group} from "@mantine/core";
import {formatCurrency} from "../../../../utilites/currency.ts";
import {t} from "@lingui/macro";
import {useGetOrderPublic} from "../../../../queries/useGetOrderPublic.ts";
import {
    useTransitionOrderToOfflinePaymentPublic
} from "../../../../mutations/useTransitionOrderToOfflinePaymentPublic.ts";
import {Card} from "../../../common/Card";
import {showError} from "../../../../utilites/notifications.tsx";

const Payment = () => {
    const navigate = useNavigate();
    const {eventId, orderShortId} = useParams();
    const {data: event, isFetched: isEventFetched} = useGetEventPublic(eventId);
    const {data: order, isFetched: isOrderFetched} = useGetOrderPublic(eventId, orderShortId, ['event']);
    const isLoading = !isOrderFetched;
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [activePaymentMethod, setActivePaymentMethod] = useState<'STRIPE' | 'OFFLINE' | 'WAAFIPAY' | null>(null);
    const [submitHandler, setSubmitHandler] = useState<(() => Promise<void>) | null>(null);
    const transitionOrderToOfflinePaymentMutation = useTransitionOrderToOfflinePaymentPublic();

    const isStripeEnabled = event?.settings?.payment_providers?.includes('STRIPE');
    const isOfflineEnabled = event?.settings?.payment_providers?.includes('OFFLINE');
    const isWaafiPayEnabled = event?.settings?.payment_providers?.includes('WAAFIPAY');

    React.useEffect(() => {
        // Automatically set the first available payment method
        if (isStripeEnabled) {
            setActivePaymentMethod('STRIPE');
        } else if (isWaafiPayEnabled) {
            setActivePaymentMethod('WAAFIPAY');
        } else if (isOfflineEnabled) {
            setActivePaymentMethod('OFFLINE');
        } else {
            setActivePaymentMethod(null); // No methods available
        }
    }, [isStripeEnabled, isWaafiPayEnabled, isOfflineEnabled]);

    const handleParentSubmit = () => {
        if (submitHandler) {
            setIsPaymentLoading(true);
            submitHandler().finally(() => setIsPaymentLoading(false));
        }
    };

    const handleSubmit = async () => {
        if (activePaymentMethod === 'STRIPE' || activePaymentMethod === 'WAAFIPAY') {
            handleParentSubmit();
        } else if (activePaymentMethod === 'OFFLINE') {
            setIsPaymentLoading(true);

            await transitionOrderToOfflinePaymentMutation.mutateAsync({
                eventId,
                orderShortId
            }, {
                onSuccess: () => {
                    navigate(`/checkout/${eventId}/${orderShortId}/summary`);
                },
                onError: (error: any) => {
                    setIsPaymentLoading(false);
                    showError(error.response?.data?.message || t`Offline payment failed. Please try again or contact the event organizer.`);
                }
            });
        }
    };

    if (!isStripeEnabled && !isWaafiPayEnabled && !isOfflineEnabled && isOrderFetched && isEventFetched) {
        return (
            <CheckoutContent>
                <Card>
                    {t`No payment methods are currently available. Please contact the event organizer for assistance.`}
                </Card>
            </CheckoutContent>
        );
    }

    return (
        <>
            <CheckoutContent>
                {isStripeEnabled && (
                    <div style={{display: activePaymentMethod === 'STRIPE' ? 'block' : 'none'}}>
                        <StripePaymentMethod enabled={true} setSubmitHandler={setSubmitHandler}/>
                    </div>
                )}

                {isWaafiPayEnabled && (
                    <div style={{display: activePaymentMethod === 'WAAFIPAY' ? 'block' : 'none'}}>
                        <WaafiPayPaymentMethod enabled={true} setSubmitHandler={setSubmitHandler}/>
                    </div>
                )}

                {isOfflineEnabled && (
                    <div style={{display: activePaymentMethod === 'OFFLINE' ? 'block' : 'none'}}>
                        <OfflinePaymentMethod event={event as Event}/>
                    </div>
                )}

                {((isStripeEnabled && isOfflineEnabled) || (isWaafiPayEnabled && isOfflineEnabled)) && (
                    <div style={{marginTop: '20px'}}>
                        <a
                            onClick={() => setActivePaymentMethod(
                                activePaymentMethod === 'OFFLINE'
                                    ? (isStripeEnabled ? 'STRIPE' : 'WAAFIPAY')
                                    : 'OFFLINE'
                            )}
                            style={{cursor: 'pointer'}}
                        >
                            {activePaymentMethod === 'OFFLINE'
                                ? t`I would like to pay using an online method (credit card etc.)`
                                : t`I would like to pay using an offline method`
                            }
                        </a>
                    </div>
                )}

                {(isStripeEnabled && isWaafiPayEnabled) && (
                    <div style={{marginTop: '20px'}}>
                        <a
                            onClick={() => setActivePaymentMethod(
                                activePaymentMethod === 'STRIPE' ? 'WAAFIPAY' : 'STRIPE'
                            )}
                            style={{cursor: 'pointer'}}
                        >
                            {activePaymentMethod === 'STRIPE'
                                ? t`I would like to pay using WaafiPay`
                                : t`I would like to pay using Stripe`
                            }
                        </a>
                    </div>
                )}
            </CheckoutContent>

            <CheckoutFooter
                event={event as Event}
                order={order as Order}
                isLoading={isLoading || isPaymentLoading}
                onClick={handleSubmit}
                buttonContent={order?.is_payment_required ? (
                    <Group gap={'10px'}>
                        <div style={{fontWeight: "bold"}}>
                            {t`Place Order`}
                        </div>
                        <div style={{fontSize: 14}}>
                            {formatCurrency(order.total_gross, order.currency)}
                        </div>
                        <div style={{fontSize: 14, fontWeight: 500}}>
                            {order.currency}
                        </div>
                    </Group>
                ) : t`Complete Payment`}
            />
        </>
    );
}

export default Payment;
