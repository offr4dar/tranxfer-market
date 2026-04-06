import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0A0F1E] py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-white">
              Tranxfer<span className="text-[#00FF87]">.</span>
            </Link>
            <p className="text-white/30 text-sm mt-1">
              Football talent marketplace
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center text-white/20 text-xs">
          © {new Date().getFullYear()} Tranxfer Market Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
