'use client'

import { useEffect } from 'react'

const selector = [
    '.serene-reveal',
    '.serene-reveal-left',
    '.serene-reveal-right',
    '.serene-reveal-scale',
].join(',')

export default function SereneRevealObserver() {
    useEffect(() => {
        const root = document.documentElement
        root.dataset.sereneReveal = 'true'

        const elements = Array.from(
            document.querySelectorAll<HTMLElement>(selector),
        )

        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !('IntersectionObserver' in window)
        ) {
            elements.forEach((element) => {
                element.classList.add('is-visible')
            })

            return () => {
                delete root.dataset.sereneReveal
            }
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return

                    entry.target.classList.add('is-visible')
                    observer.unobserve(entry.target)
                })
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -8% 0px',
            },
        )

        elements.forEach((element) => {
            observer.observe(element)
        })

        return () => {
            observer.disconnect()
            delete root.dataset.sereneReveal
        }
    }, [])

    return null
}