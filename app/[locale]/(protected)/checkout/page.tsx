import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { auth } from "@/lib/auth";
import { getActivityById } from "@/lib/actions/activities";
import { getStayById } from "@/lib/actions/stays";
import { ActivityCheckoutClient } from "./_components/ActivityCheckoutClient";
import { StayCheckoutClient } from "./_components/StayCheckoutClient";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? "");
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const type = str(sp.type);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations({ locale, namespace: "Checkout" });

  if (type === "activity") {
    const activityId  = str(sp.activityId);
    const date        = str(sp.date);
    const time        = str(sp.time);
    const adults      = parseInt(str(sp.adults) || "1", 10);
    const children    = parseInt(str(sp.children) || "0", 10);
    const agentToken  = str(sp.agentToken) || undefined;

    if (!activityId || !date || !time) {
      redirect(`/${locale}/activities`);
    }

    const activity = await getActivityById(activityId);
    if (!activity) {
      redirect(`/${locale}/activities`);
    }

    return (
      <MaxWidthWrapper>
        <div className="py-8 max-w-5xl mx-auto">
          <ActivityCheckoutClient
            activity={{
              id: activity.id,
              slug: activity.slug,
              title: activity.title,
              price: activity.price,
              cancelation: activity.cancelation ?? false,
              coverImageUrl: activity.images[0]?.url,
            }}
            date={date}
            time={time}
            adults={adults}
            children={children}
            agentToken={agentToken}
            user={{
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              phone: (session.user as { phone?: string }).phone ?? "",
            }}
            locale={locale}
            labels={{
              title: t("title"),
              backTo: t("backTo"),
              orderSummary: t("orderSummary"),
              contact: {
                title: t("contact.title"),
                subtitle: t("contact.subtitle"),
                name: t("contact.name"),
                email: t("contact.email"),
                phone: t("contact.phone"),
                namePlaceholder: t("contact.namePlaceholder"),
                emailPlaceholder: t("contact.emailPlaceholder"),
                phonePlaceholder: t("contact.phonePlaceholder"),
                next: t("contact.next"),
              },
              payment: {
                title: t("payment.title"),
                subtitle: t("payment.subtitle"),
                payNow: t("payment.payNow"),
                payLater: t("payment.payLater"),
                payNowDesc: t("payment.payNowDesc"),
                payLaterDesc: t("payment.payLaterDesc"),
                chooseMethod: t("payment.chooseMethod"),
                konnect: t("payment.konnect"),
                creditCard: t("payment.creditCard"),
                cash: t("payment.cash"),
                back: t("payment.back"),
                confirm: t("payment.confirm"),
              },
              summary: {
                adults: t("summary.adults"),
                children: t("summary.children"),
                taxes: t("summary.taxes"),
                serviceFee: t("summary.serviceFee"),
                total: t("summary.total"),
                totalNote: t("summary.totalNote"),
                perPerson: t("summary.perPerson"),
                freeCancel: t("summary.freeCancel"),
                nonRefundable: t("summary.nonRefundable"),
              },
              miniSummary: {
                adults: t("summary.adults"),
                children: t("summary.children"),
                perPerson: t("summary.perPerson"),
                taxes: t("summary.taxes"),
                serviceFee: t("summary.serviceFee"),
                total: t("summary.total"),
              },
              steps: {
                contact: t("steps.contact"),
                payment: t("steps.payment"),
              },
              success: t("success.title"),
              successWhatsNext: t("success.whatsNext"),
              successStep1: t("success.step1"),
              successStep2: t("success.step2"),
              successStep3: t("success.step3"),
              successBookingRef: t("success.bookingRef"),
              successCopied: t("success.copied"),
              error: t("error"),
              goBack: t("goBack"),
              bookAnother: t("bookAnother"),
              viewBookings: t("viewBookings"),
            }}
          />
        </div>
      </MaxWidthWrapper>
    );
  }

  if (type === "stay") {
    const stayId    = str(sp.stayId);
    const checkIn   = str(sp.checkIn);
    const checkOut  = str(sp.checkOut);
    const adults    = parseInt(str(sp.adults) || "1", 10);
    const children  = parseInt(str(sp.children) || "0", 10);

    if (!stayId || !checkIn || !checkOut) {
      redirect(`/${locale}/stays`);
    }

    const stay = await getStayById(stayId);
    if (!stay) {
      redirect(`/${locale}/stays`);
    }

    return (
      <MaxWidthWrapper>
        <div className="py-8 max-w-5xl mx-auto">
          <StayCheckoutClient
            stay={{
              id: stay.id,
              slug: stay.slug,
              title: stay.title,
              pricePerNight: stay.price,
              cleaningFee: stay.cleaningFee ?? undefined,
              serviceFee: stay.serviceFee ?? undefined,
              freeCancel: stay.cancelationPolicy === "FLEXIBLE",
              coverImageUrl: stay.images[0]?.url,
            }}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            children={children}
            user={{
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              phone: (session.user as { phone?: string }).phone ?? "",
            }}
            locale={locale}
            labels={{
              title: t("title"),
              backTo: t("backTo"),
              orderSummary: t("orderSummary"),
              contact: {
                title: t("contact.title"),
                subtitle: t("contact.subtitle"),
                name: t("contact.name"),
                email: t("contact.email"),
                phone: t("contact.phone"),
                namePlaceholder: t("contact.namePlaceholder"),
                emailPlaceholder: t("contact.emailPlaceholder"),
                phonePlaceholder: t("contact.phonePlaceholder"),
                next: t("contact.next"),
              },
              payment: {
                title: t("payment.title"),
                subtitle: t("payment.subtitle"),
                payNow: t("payment.payNow"),
                payLater: t("payment.payLater"),
                payNowDesc: t("payment.payNowDesc"),
                payLaterDesc: t("payment.payLaterDesc"),
                chooseMethod: t("payment.chooseMethod"),
                konnect: t("payment.konnect"),
                creditCard: t("payment.creditCard"),
                cash: t("payment.cash"),
                back: t("payment.back"),
                confirm: t("payment.confirm"),
              },
              summary: {
                adults: t("summary.adults"),
                children: t("summary.children"),
                nights: t("summary.nights"),
                cleaningFee: t("summary.cleaningFee"),
                serviceFee: t("summary.serviceFee"),
                taxes: t("summary.taxes"),
                total: t("summary.total"),
                totalNote: t("summary.totalNote"),
                perNight: t("summary.perNight"),
                freeCancel: t("summary.freeCancel"),
                nonRefundable: t("summary.nonRefundable"),
              },
              miniSummary: {
                nights: t("summary.nights"),
                adults: t("summary.adults"),
                children: t("summary.children"),
                perNight: t("summary.perNight"),
                cleaningFee: t("summary.cleaningFee"),
                serviceFee: t("summary.serviceFee"),
                taxes: t("summary.taxes"),
                total: t("summary.total"),
              },
              steps: {
                contact: t("steps.contact"),
                payment: t("steps.payment"),
              },
              success: t("success.title"),
              successWhatsNext: t("success.whatsNext"),
              successStep1: t("success.step1"),
              successStep2: t("success.step2"),
              successStep3: t("success.step3"),
              successBookingRef: t("success.bookingRef"),
              successCopied: t("success.copied"),
              error: t("error"),
              goBack: t("goBack"),
              bookAnother: t("bookAnother"),
              viewBookings: t("viewBookings"),
            }}
          />
        </div>
      </MaxWidthWrapper>
    );
  }

  // Unknown type — redirect home
  redirect(`/${locale}`);
}
