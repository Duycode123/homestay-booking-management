'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function AboutHero() {
    const sectionRef = useRef<HTMLElement | null>(null)
    const reduceMotion = useReducedMotion()

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
    const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 56])
    const imageScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1.07, 1.015])
    const copyY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -28])
    const copyOpacity = useTransform(scrollYProgress, [0, 0.78], reduceMotion ? [1, 1] : [1, 0.45])

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.08 } },
    }

    const itemVariants = {
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: reduceMotion ? 0.18 : 0.72, ease: [0.22, 1, 0.36, 1] as const },
        },
    }

    return (
        <section ref={sectionRef} className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-[#102E27] text-white">
            <motion.div style={{ y: imageY, scale: imageScale }} className="absolute -inset-y-16 inset-x-0">
                <Image src="/images/Banner1Vechungtoi.png" alt="The Serene Villa nằm giữa khoảng xanh và khung cảnh núi đồi" fill priority unoptimized sizes="100vw" className="banner-image-native object-cover object-[center_56%]" />
            </motion.div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,35,29,.88)_0%,rgba(10,35,29,.64)_38%,rgba(10,35,29,.14)_72%,rgba(10,35,29,.25)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d2b24]/72 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(216,181,136,.16),transparent_34%)]" />
            <div aria-hidden className="pointer-events-none absolute -left-48 -top-56 h-[36rem] w-[36rem] rounded-full border border-white/[0.06]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-64 right-[12%] h-[38rem] w-[38rem] rounded-full border border-primary-fixed/10" />

            <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-[1400px] items-end px-5 pb-14 pt-28 sm:px-8 sm:pb-20 lg:items-center lg:pb-16 lg:pt-24">
                <motion.div style={{ y: copyY, opacity: copyOpacity }} variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl">
                    <motion.div variants={itemVariants} className="flex items-center gap-3">
                        <span className="h-px w-10 bg-primary-fixed" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-fixed">Về The Serene Villa</p>
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="font-editorial mt-6 max-w-3xl text-[2.9rem] font-semibold leading-[1.01] tracking-[-0.04em] min-[380px]:text-5xl sm:text-6xl lg:text-[5.2rem]">
                        Một khoảng lặng được chăm chút từ những điều nhỏ nhất.
                    </motion.h1>
                    <motion.p variants={itemVariants} className="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                        The Serene Villa được tạo nên với mong muốn mỗi chuyến đi không chỉ là đổi một nơi để ngủ, mà là cơ hội để chậm lại, kết nối và trở về với cảm giác bình yên.
                    </motion.p>
                    <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3">
                        <Link href="#brand-story" className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 font-display text-sm font-semibold text-secondary shadow-[0_16px_34px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(0,0,0,.24)]">
                            Khám phá câu chuyện <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </Link>
                        <Link href="#team-stories" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 bg-white/8 px-6 font-display text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/14">
                            Nhật ký đội ngũ
                        </Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/16 pt-6">
                        {['Không gian riêng tư', 'Gần gũi thiên nhiên', 'Chăm sóc vừa đủ'].map((value, index) => (
                            <div key={value} className="flex items-center gap-2.5">
                                <span className="font-editorial text-lg text-primary-fixed">0{index + 1}</span>
                                <span className="text-xs font-semibold text-white/72">{value}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0.2 : 0.7, delay: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-5 right-5 hidden items-center gap-3 rounded-full border border-white/18 bg-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/78 backdrop-blur-md sm:flex lg:bottom-7 lg:right-8">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-fixed" /> Stay in serenity
            </motion.div>
        </section>
    )
}