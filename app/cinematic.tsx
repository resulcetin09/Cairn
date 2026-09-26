'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

/** One fixed film, one scroll timeline. No scroll-driven React state. */
export function CinematicBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sourceEnabled, setSourceEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = () => {
      const stop = reduced.matches || !!connection?.saveData;
      setPaused(stop);
      setSourceEnabled(!stop);
    };
    sync();
    reduced.addEventListener('change', sync);
    return () => reduced.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceEnabled || failed) return;
    video.playbackRate = 0.75;
    const sync = () => {
      if (paused || document.hidden) video.pause();
      else video.play().catch(() => setPaused(true));
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [paused, sourceEnabled, failed]);

  useEffect(() => {
    if (!sourceEnabled) return;
    let disposed = false;
    let cleanUp: (() => void) | undefined;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const intro = document.querySelector<HTMLElement>('.cinematic-intro');
        const lead = document.querySelector<HTMLElement>('.hero-copy');
        if (!intro || !lead) return;
        intro.classList.add('is-choreographed');
        const second = intro.querySelector('.story-private');
        const third = intro.querySelector('.story-outcome');
        gsap.set([second, third], { autoAlpha: 0, y: 50 });
        const tl = gsap.timeline({scrollTrigger: {
          trigger: intro, start: 'top top', end: 'bottom bottom', scrub: 0.65,
          invalidateOnRefresh: true,
          onUpdate: self => { lead.inert = self.progress > 0.24; },
        }});
        tl.to(layerRef.current, {scale: 1.18, yPercent: -3, duration: 1, ease: 'none'}, 0)
          .to(lead, {autoAlpha: 0, y: -55, duration: .2, ease: 'none'}, .09)
          .to(second, {autoAlpha: 1, y: 0, duration: .15, ease: 'none'}, .27)
          .to(second, {autoAlpha: 0, y: -45, duration: .15, ease: 'none'}, .53)
          .to(third, {autoAlpha: 1, y: 0, duration: .16, ease: 'none'}, .67)
          .to(third, {autoAlpha: 0, y: -35, duration: .12, ease: 'none'}, .88);
        gsap.to(shadeRef.current, {opacity: .72, ease: 'none', scrollTrigger: {
          trigger: '#demo', start: 'top bottom', end: 'top 20%', scrub: .8,
        }});
        return () => { intro.classList.remove('is-choreographed'); lead.inert = false; };
      });
      cleanUp = () => media.revert();
    });
    return () => { disposed = true; cleanUp?.(); };
  }, [sourceEnabled]);

  function toggleMotion() {
    if (failed) {
      setFailed(false); setReady(false); setSourceEnabled(true); setPaused(false);
      videoRef.current?.load();
    } else { setSourceEnabled(true); setPaused(value => !value); }
  }

  return <>
    <div className="cinematic-backdrop" aria-hidden="true">
      <div className="cinematic-film-layer" ref={layerRef}>
        <img className="cinematic-poster" src="/film/cairn-valley-poster.webp" alt="" width="1920" height="1080" fetchPriority="high" />
        <video ref={videoRef} className={ready && !failed ? 'cinematic-video is-ready' : 'cinematic-video'} muted playsInline loop preload="metadata" poster="/film/cairn-valley-poster.webp" src={sourceEnabled ? '/film/cairn-valley.mp4' : undefined} onCanPlay={() => setReady(true)} onError={() => {setFailed(true);setPaused(true);}} tabIndex={-1}/>
      </div>
      <div className="cinematic-scrim"/>
      <div className="cinematic-reading-shade" ref={shadeRef}/>
    </div>
    <button type="button" className="motion-control" onClick={toggleMotion} aria-label={failed ? 'Videoyu yeniden dene' : paused ? 'Videoyu oynat' : 'Videoyu durdur'} aria-pressed={!paused}>
      {failed ? <RotateCcw/> : paused ? <Play/> : <Pause/>}
      <span>{failed ? 'Videoyu yeniden dene' : paused ? 'Videoyu oynat' : 'Videoyu durdur'}</span>
    </button>
  </>;
}
