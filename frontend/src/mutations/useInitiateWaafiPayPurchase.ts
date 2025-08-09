import {useMutation} from "@tanstack/react-query";
import {orderClientPublic} from "../api/order.client.ts";
import {IdParam} from "../types.ts";

interface WaafiPayPurchaseArgs {
    eventId: IdParam;
    orderShortId: IdParam;
}

export const useInitiateWaafiPayPurchase = () => {
    return useMutation({
        mutationFn: ({eventId, orderShortId}: WaafiPayPurchaseArgs) =>
            orderClientPublic.initiateWaafiPayPurchase(Number(eventId), String(orderShortId)),
    });
};
