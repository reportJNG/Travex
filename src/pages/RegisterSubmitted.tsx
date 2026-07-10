import { Link } from "react-router";
import { CheckCircle, Clock, FileText, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TravexLogotype } from "@/components/TravexLogo";

export default function RegisterSubmitted() {
  const { user } = useAuth();
  const email = (user as any)?.email || "votre e-mail";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <TravexLogotype iconClassName="h-12 w-12" />
        </div>

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Demande soumise avec succès
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Votre inscription professionnelle a été reçue et est en cours de révision par l'équipe Travex.
          Vous recevrez une notification à{" "}
          <strong className="text-foreground">{email}</strong> une fois la décision prise.
        </p>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card text-left">
          <div className="divide-y divide-border">
            {[
              {
                icon: Clock,
                bg: "bg-amber-100",
                text: "text-amber-600",
                title: "Révision en cours",
                desc: "Notre équipe vérifie manuellement chaque inscription professionnelle pour maintenir un marketplace B2B de confiance. Cela prend généralement 1–2 jours ouvrables.",
              },
              {
                icon: FileText,
                bg: "bg-sky-100",
                text: "text-sky-600",
                title: "Révision des documents",
                desc: "Assurez-vous que les documents soumis sont clairs et lisibles. Si un document doit être remplacé, vous serez notifié et pourrez le soumettre à nouveau.",
              },
              {
                icon: Mail,
                bg: "bg-violet-100",
                text: "text-violet-600",
                title: "Notification",
                desc: "Vous serez notifié par e-mail et via les notifications in-app une fois votre compte approuvé, rejeté, ou si des documents doivent être remplacés.",
              },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.text}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/pending">Voir le statut de la demande</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Des questions ?{" "}
          <a
            href="mailto:contact@nexelite.co"
            className="font-medium text-primary hover:underline"
          >
            Contacter le support
          </a>
        </p>
      </div>
    </div>
  );
}
