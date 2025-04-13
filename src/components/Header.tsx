"use client";
import Link from "next/link"
import { usePathname } from "next/navigation"

const NavLink = ({ href, label }: { href: string; label: string }) => {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link href={href} className={`text-primary text-base transition-opacity duration-300 ${isActive ? 'opacity-100 font-medium' : 'opacity-50 font-normal'} hover:opacity-100`}>
            {label}
        </Link>
    )
}

export const Header = () => {
    return (
        <div className="flex flex-col items-end space-y-4">
            <NavLink href="/" label="about" />
            <NavLink href="/thoughts" label="thoughts" />
            <NavLink href="/work" label="work" />
        </div>
    )
}