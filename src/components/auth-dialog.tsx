'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  link: string;
  username: string;
}

export function AuthDialog({
  open,
  onOpenChange,
  code,
  link,
  username,
}: AuthDialogProps) {
  const [copied, setCopied] = useState(false);

  // Auto-open login page when dialog opens
  useEffect(() => {
    if (open && link) {
      window.open(link, '_blank');
    }
  }, [open, link]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLink = () => {
    window.open(link, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🔐 Xbox Login Required</DialogTitle>
          <DialogDescription>
            Bot <span className="font-semibold text-foreground">{username}</span> needs Xbox authentication
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Click the button below to open Microsoft login page
            </p>
            <Button onClick={openLink} className="w-full" variant="default">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Login Page
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              2. Enter this code on the login page:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-lg font-bold text-center tracking-wider">
                {code}
              </div>
              <Button
                onClick={copyCode}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-500">✓ Code copied to clipboard!</p>
            )}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              After logging in, your bot will automatically connect to the server.
              This dialog will close automatically once authenticated.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
