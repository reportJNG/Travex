import { Link } from "react-router";
import { CheckCircle, Clock, FileText, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TravexLogotype } from "@/components/TravexLogo";

export default function RegisterSubmitted() {
  const { user } = useAuth();
  const email = (user as any)?.email || "your email";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <TravexLogotype iconClassName="h-12 w-12" />
        </div>

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Application submitted
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Your business registration has been received and is under review by
          the Travex team. You will receive a notification at{" "}
          <strong>{email}</strong> once a decision has been made.
        </p>

        <Card className="mt-8 text-left">
          <CardContent className="divide-y p-0">
            <div className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Review in progress</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our team manually reviews each business registration to
                  maintain a trusted B2B marketplace. This typically takes
                  1–2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold">Document review</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Make sure your submitted documents are clear and legible.
                  If a document needs replacement, you will be notified and
                  given the opportunity to resubmit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Mail className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold">Notification</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You will be notified by email and in-app notification once
                  your account is approved, rejected, or if any documents need
                  replacement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/pending">View application status</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Questions?{" "}
          <a
            href="mailto:contact@nexelite.co"
            className="font-medium text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
