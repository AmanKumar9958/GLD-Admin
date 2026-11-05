import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Globe, ExternalLink, Smartphone, ShieldCheck } from 'lucide-react'

export const Settings = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Links</h1>
        <p className="text-sm text-gray-500 mt-1">Platform URLs, portals, and official resources.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span>Official Platforms & URLs</span>
          </CardTitle>
          <CardDescription>
            Direct links to GLD Shikshalaya public platforms and portals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <div>
              <p className="text-sm font-bold text-gray-900">Main Student Website</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">https://gldianknights.com/</p>
            </div>
            <a
              href="https://gldianknights.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 hover:text-primary transition-colors shadow-xs w-fit"
            >
              <span>Visit Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <div>
              <p className="text-sm font-bold text-gray-900">Android Mobile App</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Google Play Store listing</p>
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=com.solostackdev.gldshikshalaya"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 hover:text-primary transition-colors shadow-xs w-fit"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Google Play</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <div>
              <p className="text-sm font-bold text-gray-900">Admin Portal</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">https://gld-admin.netlify.app/</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold w-fit border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
