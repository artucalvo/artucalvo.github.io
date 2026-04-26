document.addEventListener("DOMContentLoaded", function () {
    var navbar = document.querySelector(".navbar.fixed-top");
    var collapseElement = document.getElementById("main-navbar");
    var contactForm = document.getElementById("contactForm");
    var successBox = document.getElementById("success");
    var nameInput = document.getElementById("name");
    var floatingGroups = document.querySelectorAll(".floating-label-form-group");
    var contactButton = document.getElementById("contactButton");
    var sectionNavLinks = Array.from(document.querySelectorAll('#main-navbar .nav-link[href^="#"]')).filter(function (link) {
        var targetId = link.getAttribute("href");
        return targetId && targetId !== "#page-top" && document.querySelector(targetId);
    });

    function updateNavbarShrink() {
        if (!navbar) return;
        if (window.scrollY >= 300) {
            navbar.classList.add("navbar-shrink");
        } else {
            navbar.classList.remove("navbar-shrink");
        }
    }

    function updateFloatingLabelState(group) {
        var control = group.querySelector("input, textarea");
        if (!control) return;
        if ((control.value || "").trim().length > 0) {
            group.classList.add("floating-label-form-group-with-value");
        } else {
            group.classList.remove("floating-label-form-group-with-value");
        }
    }

    function showAlert(type, message) {
        if (!successBox) return;
        successBox.innerHTML = [
            '<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">',
            "<strong>" + message + "</strong>",
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            "</div>"
        ].join("");
    }

    function hideMobileNavbar() {
        var toggler = document.querySelector(".navbar-toggler");
        if (!collapseElement || !toggler || !window.bootstrap || !window.bootstrap.Collapse) return;
        if (window.getComputedStyle(toggler).display === "none") return;

        var collapse = window.bootstrap.Collapse.getOrCreateInstance(collapseElement, { toggle: false });
        collapse.hide();
        window.setTimeout(function () {
            collapse.hide();
        }, 360);
    }

    function updateActiveNavLink() {
        var markerOffset = Math.min(window.innerHeight * 0.34, 360);
        var marker = window.scrollY + (navbar ? navbar.offsetHeight : 0) + markerOffset;
        var currentLink = null;

        sectionNavLinks.forEach(function (link) {
            var section = document.querySelector(link.getAttribute("href"));
            if (!section) return;

            var top = section.offsetTop;
            var bottom = top + section.offsetHeight;
            if (marker >= top && marker < bottom) {
                currentLink = link;
            }
        });

        sectionNavLinks.forEach(function (link) {
            link.classList.toggle("active", link === currentLink);
        });
    }

    document.querySelectorAll('.page-scroll a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (event) {
            var targetId = link.getAttribute("href");
            var target = targetId ? document.querySelector(targetId) : null;
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            hideMobileNavbar();
        });
    });

    if (collapseElement && window.bootstrap && window.bootstrap.Collapse) {
        document.querySelectorAll("#main-navbar .nav-link").forEach(function (link) {
            link.addEventListener("click", function () {
                hideMobileNavbar();
            });
        });
    }

    floatingGroups.forEach(function (group) {
        var control = group.querySelector("input, textarea");
        if (!control) return;
        updateFloatingLabelState(group);
        control.addEventListener("input", function () {
            updateFloatingLabelState(group);
        });
        control.addEventListener("focus", function () {
            group.classList.add("floating-label-form-group-with-focus");
        });
        control.addEventListener("blur", function () {
            group.classList.remove("floating-label-form-group-with-focus");
            updateFloatingLabelState(group);
        });
    });

    if (nameInput) {
        nameInput.addEventListener("focus", function () {
            if (successBox) successBox.innerHTML = "";
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            var originalButtonText = contactButton ? contactButton.value : "";
            if (contactButton) {
                contactButton.disabled = true;
                contactButton.value = "Sending...";
            }

            try {
                var response = await fetch(contactForm.action, {
                    method: contactForm.method || "POST",
                    body: new FormData(contactForm),
                    headers: { Accept: "application/json" }
                });

                if (!response.ok) {
                    throw new Error("Form submission failed");
                }

                showAlert("success", "Your message has been sent.");
                contactForm.reset();
                floatingGroups.forEach(updateFloatingLabelState);
            } catch (error) {
                var name = (nameInput && nameInput.value ? nameInput.value : "").trim();
                var prefix = name ? "Sorry " + name + ", " : "Sorry, ";
                showAlert("danger", prefix + "it seems that the mail server is not responding. Please try again later!");
            } finally {
                if (contactButton) {
                    contactButton.disabled = false;
                    contactButton.value = originalButtonText || "Submit";
                }
            }
        });
    }

    updateNavbarShrink();
    updateActiveNavLink();
    window.addEventListener("scroll", function () {
        updateNavbarShrink();
        updateActiveNavLink();
    }, { passive: true });
    window.addEventListener("resize", updateActiveNavLink);
});
