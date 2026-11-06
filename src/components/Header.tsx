const NavLink = ({ href, label }: { href: string; label: string }) => {
    const pathname = window.location.pathname
    const isActive = pathname === href

    return (
        <a href={href} className={`text-primary text-base transition-opacity duration-300 ${isActive ? 'opacity-100 font-medium' : 'opacity-50 font-normal'} hover:opacity-100`}>
            {label}
        </a>
    )
}

export const Header = () => {
    return (
        <div className="flex md:flex-col items-end md:space-y-4 space-x-4 md:space-x-0">
            <NavLink href="/" label="about" />
            <NavLink href="/thoughts" label="thoughts" />
            {/* <NavLink href="/work" label="work" /> */}
        </div>
    )
}
