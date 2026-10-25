// Zoom Disable Script
(function() {
    function applyViewportLock() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = "viewport";
            document.head.appendChild(viewport);
        }
        // allow zooming on photos. Written only on change: each write makes the browser recompute the viewport
        const locked = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        if (!window.location.href.includes("facebook.com/photo.php") && viewport.content !== locked)
            viewport.content = locked;
    }

    applyViewportLock();
    window.onDomChange(applyViewportLock);
})();