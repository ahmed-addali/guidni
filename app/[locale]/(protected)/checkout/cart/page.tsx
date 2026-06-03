import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { CartCheckoutForm } from "./_components/CartCheckoutForm";

type Params = Promise<{ locale: string }>;

export default async function CartCheckoutPage({ params }: { params: Params }) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "CartPage" });

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <CartCheckoutForm
        locale={locale}
        labels={{
          empty:             t("empty"),
          emptyHint:         t("emptyHint"),
          orderSummary:      t("orderSummary"),
          delivery:          t("delivery"),
          deliveryMethod:    {
            PICKUP:   t("deliveryMethod.PICKUP"),
            DELIVERY: t("deliveryMethod.DELIVERY"),
          },
          deliveryAddress:   t("deliveryAddress"),
          deliveryCity:      t("deliveryCity"),
          deliveryCountry:   t("deliveryCountry"),
          notes:             t("notes"),
          notesPlaceholder:  t("notesPlaceholder"),
          subtotal:          t("subtotal"),
          deliveryCost:      t("deliveryCost"),
          freeDelivery:      t("freeDelivery"),
          deliveryCalculated: t("deliveryCalculated"),
          shopSubtotal:      t("shopSubtotal"),
          grandTotal:        t("grandTotal"),
          placeOrder:        t("placeOrder"),
          paymentNote:       t("paymentNote"),
          addressRequired:   t("addressRequired"),
          success:           t("success"),
          error:             t("error"),
        }}
      />
    </div>
  );
}
