'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useMotionValue, useTransform, animate } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import confetti from 'canvas-confetti'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

const CursorTrail = () => {
  const [trail, setTrail] = useState([])
  const maxTrailLength = 20

  useEffect(() => {
    const handleMouseMove = (e) => {
      setTrail((prevTrail) => [
        { x: e.clientX, y: e.clientY },
        ...prevTrail.slice(0, maxTrailLength - 1),
      ])
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      {trail.map((point, index) => (
        <motion.div
          key={index}
          className="cursor-trail"
          style={{
            position: 'fixed',
            left: point.x,
            top: point.y,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: `rgba(255, 255, 255, ${1 - index / maxTrailLength})`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

const ParallaxText = ({ children, baseVelocity = 100 }) => {
  const baseX = useMotionValue(0)
  const x = useTransform(baseX, (v) => `${v}%`)

  useEffect(() => {
    const controls = animate(baseX, -100, {
      type: 'tween',
      duration: 20,
      ease: 'linear',
      repeat: Infinity,
    })

    return controls.stop
  }, [baseX])

  return (
    <div className="parallax">
      <motion.div className="scroller" style={{ x }}>
        <span>{children} </span>
        <span>{children} </span>
        <span>{children} </span>
        <span>{children} </span>
      </motion.div>
    </div>
  )
}

const FeatureCard = ({ title, description, icon }) => {
  const controls = useAnimation()
  const [ref, inView] = useInView()

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 },
      }}
      className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 flex flex-col items-center text-center"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p>{description}</p>
    </motion.div>
  )
}

const InteractiveAvatar = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const handleMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left - 25,
        y: e.clientY - rect.top - 25,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg overflow-hidden cursor-none"
      onMouseMove={handleMove}
    >
      <motion.div
        className="absolute w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl"
        animate={position}
        transition={{ type: 'spring', damping: 10 }}
      >
        👤
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
        Move your cursor to explore!
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [confettiTriggered, setConfettiTriggered] = useState(false)

  const triggerConfetti = () => {
    if (!confettiTriggered) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      setConfettiTriggered(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <CursorTrail />
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">MetaNest</h1>
        <nav>
          <Button variant="ghost" className="mr-2">Features</Button>
          <Button variant="ghost" className="mr-2">Pricing</Button>
          <Button>Sign Up</Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <motion.h1
            className="text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to MetaNest
          </motion.h1>
          <motion.p
            className="text-xl mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Experience the future of remote work in our 2D metaverse
          </motion.p>
          <Button size="lg" onClick={triggerConfetti}>Get Started</Button>
        </section>

        <ParallaxText baseVelocity={-5}>
          Collaborate • Innovate • Gamify • Succeed •
        </ParallaxText>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Explore Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="2D Metaverse Office"
              description="Immerse yourself in a vibrant 2D world where work meets play."
              icon="🏢"
            />
            <FeatureCard
              title="Social Integration"
              description="Connect your social accounts and collaborate seamlessly."
              icon="🔗"
            />
            <FeatureCard
              title="Gamified Tasks"
              description="Turn work into play with rewards and achievements."
              icon="🎮"
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Interactive Workspace</h2>
          <InteractiveAvatar />
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Join MetaNest Today</h2>
          <div className="text-center">
            <p className="mb-4">Ready to revolutionize your remote work experience?</p>
            <Button size="lg" asChild>
              <Link href="/signup">Sign Up Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mt-16 py-8 bg-gray-800 text-center">
        <p>&copy; 2024 MetaNest. All rights reserved.</p>
      </footer>
    </div>
  )
}