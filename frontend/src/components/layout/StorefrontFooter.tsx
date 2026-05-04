import Link from 'next/link'

/**
 * Shared marketplace footer (newsletter, legal, helpful links).
 */
export default function StorefrontFooter() {
  return (
    <footer className="border-t border-primary-700/50 bg-primary text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 py-10 px-6 md:px-12">
        <div className="flex flex-col space-y-5">
          <img src="/images/Logo (2).png" alt="GoSellr" className="h-8 w-auto object-contain" />
          <div className="flex space-x-3">
            <span className="border border-white/25 rounded-md p-1 bg-white">
              <img src="/images/appstore icon.png" alt="App Store" className="h-8" />
            </span>
            <span className="border border-white/25 rounded-md p-1 bg-white">
              <img src="/images/google play badge.png" alt="Google Play" className="h-8" />
            </span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Company # 490039-445, Registered with
            <br />
            House of companies.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-base leading-tight text-white">Deals in your inbox</h3>
          <div className="flex items-center w-full max-w-sm bg-white border border-white/30 rounded-full overflow-hidden shadow-sm">
            <input
              type="email"
              placeholder="youremail@gmail.com"
              className="flex-grow bg-transparent text-wm-ink py-2 px-4 focus:outline-none placeholder:text-wm-muted text-sm min-w-0"
            />
            <button
              type="button"
              className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-full text-xs font-semibold mr-0.5 my-0.5 transition-colors shrink-0"
            >
              Subscribe
            </button>
          </div>
          <p className="text-[11px] text-white/75">
            We won&apos;t spam — read our{' '}
            <a href="/privacy" className="text-white underline underline-offset-2 hover:text-white/90">
              email policy
            </a>
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-base text-white">Legal</h3>
          <ul className="space-y-2.5 text-sm text-white/85">
            <li className="hover:text-white cursor-pointer transition-colors">Terms and conditions</li>
            <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
            <li className="hover:text-white cursor-pointer transition-colors">Cookies</li>
            <li className="hover:text-white cursor-pointer transition-colors">Statement</li>
          </ul>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-base text-white">Helpful links</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/login/customer" className="text-white/85 hover:text-white">
                Get help
              </Link>
            </li>
            <li>
              <Link href="/login/seller" className="text-white/85 hover:text-white">
                Add your restaurant
              </Link>
            </li>
            <li>
              <Link href="/login/rider" className="text-white/85 hover:text-white">
                Sign up to deliver
              </Link>
            </li>
            <li>
              <Link href="/login/seller" className="text-white/85 hover:text-white">
                Create a business account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-700/50 py-6 text-center text-sm text-white/75">
        © {new Date().getFullYear()} GoSellr. All rights reserved.
      </div>
    </footer>
  )
}
