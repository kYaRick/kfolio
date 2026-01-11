(function () {
    const storageKey = "kfolio.theme";
    const themeAttribute = "data-theme";

    window.kfolioTheme = {
        get: function () {
            return localStorage.getItem(storageKey);
        },
        set: function (theme) {
            const value = (theme ?? "").trim();

            if (value.length === 0) {
                document.documentElement.removeAttribute(themeAttribute);
                localStorage.removeItem(storageKey);
                return;
            }

            document.documentElement.setAttribute(themeAttribute, value);
            localStorage.setItem(storageKey, value);
        },
        init: function () {
            const saved = localStorage.getItem(storageKey);
            if (saved && saved.trim().length > 0) {
                document.documentElement.setAttribute(themeAttribute, saved);
            }
        }
    };

    window.kfolioTheme.init();

    document.addEventListener('click', function (e) {
        const switcher = e.target.closest('.theme-switcher');
        
        if (switcher) {
            if (window.matchMedia("(pointer: coarse)").matches) {
                switcher.classList.toggle('open');
            }
        } else {
            document.querySelectorAll('.theme-switcher.open').forEach(s => {
                s.classList.remove('open');
            });
        }
    });

    function handleScroll() {
        const btn = document.querySelector('.scroll-to-top');
        if (btn) {
            const scrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            if (scrolled > 100) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }
    }

    window.addEventListener('scroll', handleScroll);
    // Initial check
    setTimeout(handleScroll, 500);
})();