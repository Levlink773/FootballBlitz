// particleConfig.js

export const particleOptions = {
    fullScreen: {
        enable: false // Important! We want particles inside the modal, not the whole screen
    },
    particles: {
        number: {
            value: 0 // Start with 0, we'll emit them on demand
        },
        color: {
            value: ["#FFD700", "#FFA500", "#FFFFFF", "#FFC0CB"] // Gold, orange, white, pink
        },
        shape: {
            type: ["circle", "square"], // Different shapes
        },
        opacity: {
            value: { min: 0.5, max: 1 },
            animation: {
                enable: true,
                speed: 1,
                startValue: "max",
                destroy: "min",
            },
        },
        size: {
            value: { min: 2, max: 5 },
        },
        links: {
            enable: false,
        },
        move: {
            enable: true,
            speed: 5,
            direction: "top",
            gravity: {
                enable: true,
                acceleration: 20
            },
            outModes: {
                top: "destroy",
                default: "bounce"
            },
        },
    },
    interactivity: {
        detectsOn: "canvas",
        events: {
            resize: true,
        },
    },
    detectRetina: true,
    background: {
        color: "transparent", // Transparent background
    },
    emitters: {
        direction: "top",
        position: {
            x: 50,
            y: 100,
        },
        rate: {
            delay: 0.1,
            quantity: 10,
        },
        size: {
            width: 100,
            height: 0,
        },
        life: {
            duration: 0.5,
            count: 1, // Only emit once
        },
    },
};