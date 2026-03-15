"use client";

import { useRef, useCallback, useEffect } from "react";

function useIdleTimeout(timeout_ms: number, on_idle: () => void) {
    const on_idle_ref = useRef(on_idle);
    useEffect(() => {
        on_idle_ref.current = on_idle;
    }, [on_idle]);

    const timeout_id_ref = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset_timer = useCallback(() => {
        if (timeout_id_ref.current !== null) {
            clearTimeout(timeout_id_ref.current);
            timeout_id_ref.current = null;
        }
        if (timeout_ms !== Infinity && Number.isFinite(timeout_ms)) {
            timeout_id_ref.current = setTimeout(() => {
                on_idle_ref.current();
            }, timeout_ms);
        }
    }, [timeout_ms]);

    useEffect(() => {
        const opts_passive = { passive: true } as AddEventListenerOptions;
        window.addEventListener("mousemove", reset_timer);
        window.addEventListener("mousedown", reset_timer);
        window.addEventListener("keydown", reset_timer);
        window.addEventListener("touchstart", reset_timer, opts_passive);
        window.addEventListener("scroll", reset_timer, opts_passive);
        window.addEventListener("click", reset_timer);

        reset_timer();

        return () => {
            if (timeout_id_ref.current !== null) {
                clearTimeout(timeout_id_ref.current);
                timeout_id_ref.current = null;
            }
            window.removeEventListener("mousemove", reset_timer);
            window.removeEventListener("mousedown", reset_timer);
            window.removeEventListener("keydown", reset_timer);
            window.removeEventListener("touchstart", reset_timer);
            window.removeEventListener("scroll", reset_timer);
            window.removeEventListener("click", reset_timer);
        };
    }, [reset_timer]);
}

export const use_idle_timeout = useIdleTimeout;
