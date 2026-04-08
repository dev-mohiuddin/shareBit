import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supportChannels } from "@/content/landing/copy";

const channelIcons = {
  Email: <Mail className="h-4 w-4" />,
  Phone: <Phone className="h-4 w-4" />,
  Office: <MapPin className="h-4 w-4" />,
};

export const ContactCtaSection = () => {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
      <Card className="border-border/70 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Ready to build your portfolio with ShareBit?</CardTitle>
          <p className="text-sm text-muted-foreground">
            ShareBit এর মাধ্যমে পেশাদার মানের বিনিয়োগ অভিজ্ঞতা শুরু করুন।
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-3">
            {supportChannels.map((channel) => (
              <div key={channel.label} className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-3 text-sm">
                <span className="rounded-md bg-muted p-2 text-muted-foreground">{channelIcons[channel.label]}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{channel.label}</p>
                  <p className="font-medium">{channel.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-md border border-border/60 bg-background p-4">
            <p className="text-sm font-medium">Get platform updates</p>
            <p className="text-xs text-muted-foreground">
              Product updates, opportunity highlights, and investor operations notes.
            </p>
            <Input placeholder="you@company.com" type="email" />
            <div className="flex flex-wrap gap-2">
              <Button>Subscribe</Button>
              <Button variant="outline" asChild>
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
