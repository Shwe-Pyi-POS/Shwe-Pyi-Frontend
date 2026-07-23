import React from "react";
import { Share2, Facebook, Instagram, Globe, ExternalLink } from "lucide-react";
import { SocialMedia } from "../../services/ShopSettings/fetchShopSettings";

interface SocialMediaCardProps {
  socialMedia: SocialMedia;
}

const SocialLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  url: string;
}> = ({ icon, label, url }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm text-blue-600 truncate">{url}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
    </a>
  );
};

export const SocialMediaCard: React.FC<SocialMediaCardProps> = ({
  socialMedia,
}) => {
  const hasLinks =
    socialMedia.facebook || socialMedia.instagram || socialMedia.website;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full">
      <div className="p-4 sm:p-6 border-b">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          Social Media & Website
        </h3>
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        {!hasLinks ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No social media links configured
          </p>
        ) : (
          <>
            <SocialLink
              icon={<Facebook className="w-4 h-4" />}
              label="Facebook"
              url={socialMedia.facebook}
            />
            <SocialLink
              icon={<Instagram className="w-4 h-4" />}
              label="Instagram"
              url={socialMedia.instagram}
            />
            <SocialLink
              icon={<Globe className="w-4 h-4" />}
              label="Website"
              url={socialMedia.website}
            />
          </>
        )}
      </div>
    </div>
  );
};
