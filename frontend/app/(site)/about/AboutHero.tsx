'use client'

import Image from 'next/image'
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'framer-motion'
import { useRef } from 'react'

export default function AboutHero() {
    const sectionRef = useRef<HTMLElement | null>(null)
    const reduceMotion = useReducedMotion()

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    })

    const imageY = useTransform(
        scrollYProgress,
        [0, 1],
        reduceMotion ? [0, 0] : [0, 42],
    )

    const imageScale = useTransform(
        scrollYProgress,
        [0, 1],
        reduceMotion ? [1, 1] : [1.04, 1],
    )

    const copyY = useTransform(
        scrollYProgress,
        [0, 1],
        reduceMotion ? [0, 0] : [0, -16],
    )

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: reduceMotion ? 0 : 0.11,
                delayChildren: reduceMotion ? 0 : 0.08,
            },
        },
    }

    const itemVariants = {
        hidden: reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 24, filter: 'blur(5px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: reduceMotion ? 0.18 : 0.65,
                ease: [0.22, 1, 0.36, 1] as const,
            },
        },
    }

    return (
        <section
            ref={sectionRef}
            className="relative isolate overflow-hidden bg-secondary py-14 text-white sm:py-16 lg:py-20"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-44 -top-52 h-[34rem] w-[34rem] rounded-full border border-white/[0.06]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-64 right-[24%] h-[38rem] w-[38rem] rounded-full border border-primary-fixed/10"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(216,181,136,0.12),transparent_31%)]"
            />

            <div className="relative mx-auto grid w-full min-w-0 max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-14">
                <motion.div
                    style={{ y: copyY }}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="min-w-0 max-w-xl lg:py-10"
                >
                    <motion.div variants={itemVariants} className="flex items-center gap-3">
                        <span className="h-px w-10 bg-primary-fixed" />

                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-fixed">
                            Về The Serene Villa
                        </p>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="font-editorial mt-5 text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.035em] min-[380px]:text-5xl sm:text-6xl lg:text-[4.2rem]"
                    >
                        Một khoảng lặng được chăm chút từ những điều nhỏ nhất.
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mt-6 max-w-lg text-base leading-8 text-white/72 sm:text-lg"
                    >
                        The Serene Villa được tạo nên với mong muốn mỗi chuyến đi không chỉ
                        là đổi một nơi để ngủ, mà là cơ hội để chậm lại, kết nối và trở về
                        với cảm giác bình yên.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/12 pt-6"
                    >
                        {[
                            'Không gian riêng tư',
                            'Gần gũi thiên nhiên',
                            'Chăm sóc vừa đủ',
                        ].map((value, index) => (
                            <div key={value} className="flex items-center gap-2.5">
                                <span className="font-editorial text-lg text-primary-fixed">
                                    0{index + 1}
                                </span>
                                <span className="text-xs font-semibold text-white/68">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={
                        reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, x: 36, scale: 0.975 }
                    }
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                        duration: reduceMotion ? 0.2 : 0.85,
                        delay: reduceMotion ? 0 : 0.12,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={
                        reduceMotion
                            ? undefined
                            : {
                                y: -6,
                                transition: { duration: 0.28 },
                            }
                    }
                    className="relative min-w-0 lg:py-3"
                >
                    <div
                        aria-hidden="true"
                        className="absolute -bottom-6 left-[8%] h-20 w-[84%] rounded-[50%] bg-black/30 blur-3xl"
                    />

                    <div className="relative overflow-hidden rounded-[28px] border border-white/14 bg-[#514C44] shadow-[0_34px_90px_rgba(0,0,0,0.3)]">
                        <div className="relative aspect-[4/3] min-h-0 sm:min-h-[470px] lg:min-h-[540px]">
                            <motion.div
                                style={{ y: imageY, scale: imageScale }}
                                className="absolute -inset-y-10 inset-x-0"
                            >
                                <Image
                                    src="/images/Banner.png?v=20260715-original"
                                    alt="The Serene Villa nằm giữa khoảng xanh và khung cảnh núi đồi"
                                    fill
                                    priority
                                    unoptimized
                                    sizes="(max-width: 1024px) 100vw, 58vw"
                                    className="banner-image-native object-cover object-[center_56%]"
                                />
                            </motion.div>

                            <div className="absolute inset-0 bg-gradient-to-t from-secondary/72 via-transparent to-black/8" />
                            <div className="absolute inset-0 bg-gradient-to-r from-secondary/18 via-transparent to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary-fixed">
                                        The Serene Villa
                                    </p>
                                    <p className="font-editorial mt-1 text-xl font-semibold text-white sm:text-2xl">
                                        Bình yên có một hình hài.
                                    </p>
                                </div>

                                <span className="hidden rounded-full border border-white/22 bg-secondary/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-md sm:inline-flex">
                                    Stay in serenity
                                </span>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        aria-hidden="true"
                        animate={
                            reduceMotion
                                ? undefined
                                : {
                                    y: [0, -7, 0],
                                }
                        }
                        transition={{
                            duration: 5.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute -right-4 top-8 hidden h-20 w-20 rounded-full border border-primary-fixed/35 lg:block"
                    />
                </motion.div>
            </div>
        </section>
    )
}
