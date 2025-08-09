import {useEffect} from "react";
import {useParams} from "react-router";
import {t} from "@lingui/macro";
import {useGetEventPublic} from "../../../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../../../layouts/Checkout/CheckoutContent";
import {HomepageInfoMessage} from "../../../../../common/HomepageInfoMessage";
import {eventHomepagePath} from "../../../../../../utilites/urlHelper.ts";
import {Event} from "../../../../../../types.ts";
import {LoadingMask} from "../../../../../common/LoadingMask";
import {useInitiateWaafiPayPurchase} from "../../../../../../mutations/useInitiateWaafiPayPurchase.ts";

interface WaafiPayPaymentMethodProps {
    enabled: boolean;
    setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const WaafiPayPaymentMethod = ({enabled, setSubmitHandler}: WaafiPayPaymentMethodProps) => {
    const {eventId, orderShortId} = useParams();
    const {data: event} = useGetEventPublic(eventId);
    const initiatePurchase = useInitiateWaafiPayPurchase();

    const handleSubmit = async () => {
        const response = await initiatePurchase.mutateAsync({eventId, orderShortId});
        const redirectUrl = response?.hppUrl || response?.hppLink;
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    };

    useEffect(() => {
        if (setSubmitHandler) {
            setSubmitHandler(() => handleSubmit);
        }
    }, [setSubmitHandler, eventId, orderShortId]);

    if (!enabled) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    message={t`WaafiPay payments are not enabled for this event.`}
                    link={eventHomepagePath(event as Event)}
                    linkText={t`Return to event page`}
                />
            </CheckoutContent>
        );
    }

    return initiatePurchase.isPending ? <LoadingMask/> : null;
};

export default WaafiPayPaymentMethod;
