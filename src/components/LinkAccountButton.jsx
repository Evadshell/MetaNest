// components/AccountLinkButton.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Mail, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { linkAccount } from '@/lib/authHelper';

const providerIcons = {
  github: Github,
  'google-oauth2': Mail,
};

const providerNames = {
  github: 'GitHub',
  'google-oauth2': 'Google',
};

export function AccountLinkButton({ provider, isLinked, onLink }) {
  const [isLinking, setIsLinking] = useState(false);
  const Icon = providerIcons[provider];

  const handleLink = async () => {
    if (isLinked) return;
    setIsLinking(true);
    
    try {
      await linkAccount(provider);
      toast.success(`Successfully linked ${providerNames[provider]} account`);
      onLink?.(true);
    } catch (error) {
      toast.error('Failed to link account. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Button
      variant={isLinked ? 'secondary' : 'ghost'}
      className="w-full justify-start mb-4 relative"
      onClick={handleLink}
      disabled={isLinking}
    >
      {isLinking ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {isLinked ? (
        <>
          Connected to {providerNames[provider]}
          <Check className="h-4 w-4 absolute right-4" />
        </>
      ) : (
        `Link ${providerNames[provider]} Account`
      )}
    </Button>
  );
}