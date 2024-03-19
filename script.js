function loaderImageAnimation() {
  // body element
  const body = document.body;

  // helper functions
  const MathUtils = {
    // linear interpolation
    lerp: (a, b, n) => (1 - n) * a + n * b,
    // distance between two points
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  };

  // calculate the viewport size
  let winsize;
  const calcWinsize = () =>
    (winsize = { width: window.innerWidth, height: window.innerHeight });
  calcWinsize();
  // and recalculate on resize
  window.addEventListener("resize", calcWinsize);

  // get the mouse position
  const getMousePos = (ev) => {
    let posx = 0;
    let posy = 0;
    if (!ev) ev = window.event;
    if (ev.pageX || ev.pageY) {
      posx = ev.pageX;
      posy = ev.pageY;
    } else if (ev.clientX || ev.clientY) {
      posx = ev.clientX + body.scrollLeft + docEl.scrollLeft;
      posy = ev.clientY + body.scrollTop + docEl.scrollTop;
    }
    return { x: posx, y: posy };
  };

  // mousePos: current mouse position
  // cacheMousePos: previous mouse position
  // lastMousePos: last last recorded mouse position (at the time the last image was shown)
  let mousePos = (lastMousePos = cacheMousePos = { x: 0, y: 0 });

  // update the mouse position
  window.addEventListener("mousemove", (ev) => (mousePos = getMousePos(ev)));

  // gets the distance from the current mouse position to the last recorded mouse position
  const getMouseDistance = () =>
    MathUtils.distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

  class Image {
    constructor(el) {
      this.DOM = { el: el };
      // image deafult styles
      this.defaultStyle = {
        x: 0,
        y: 0,
        opacity: 0,
      };
      // get sizes/position
      this.getRect();
      // init/bind events
      this.initEvents();
    }
    initEvents() {
      // on resize get updated sizes/position
      window.addEventListener("resize", () => this.resize());
    }
    resize() {
      // reset styles
      gsap.set(this.DOM.el, this.defaultStyle);
      // get sizes/position
      this.getRect();
    }
    getRect() {
      this.rect = this.DOM.el.getBoundingClientRect();
    }
    isActive() {
      // check if image is animating or if it's visible
      return gsap.isTweening(this.DOM.el) || this.DOM.el.style.opacity != 0;
    }
  }

  class ImageTrail {
    constructor() {
      // images container
      this.DOM = { content: document.querySelector(".content") };
      // array of Image objs, one per image element
      this.images = [];
      [...this.DOM.content.querySelectorAll("img")].forEach((img) =>
        this.images.push(new Image(img))
      );
      // total number of images
      this.imagesTotal = this.images.length;
      // upcoming image index
      this.imgPosition = 0;
      // zIndex value to apply to the upcoming image
      this.zIndexVal = 1;
      // mouse distance required to show the next image
      this.threshold = 50;
      // render the images
      requestAnimationFrame(() => this.render());
    }
    render() {
      // get distance between the current mouse position and the position of the previous image
      let distance = getMouseDistance();
      // cache previous mouse position
      cacheMousePos.x = MathUtils.lerp(
        cacheMousePos.x || mousePos.x,
        mousePos.x,
        0.1
      );
      cacheMousePos.y = MathUtils.lerp(
        cacheMousePos.y || mousePos.y,
        mousePos.y,
        0.1
      );

      // if the mouse moved more than [this.threshold] then show the next image
      if (distance > this.threshold) {
        this.showNextImage();

        ++this.zIndexVal;
        this.imgPosition =
          this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;

        lastMousePos = mousePos;
      }

      // check when mousemove stops and all images are inactive (not visible and not animating)
      let isIdle = true;
      for (let img of this.images) {
        if (img.isActive()) {
          isIdle = false;
          break;
        }
      }
      // reset z-index initial value
      if (isIdle && this.zIndexVal !== 1) {
        this.zIndexVal = 1;
      }

      // loop..
      requestAnimationFrame(() => this.render());
    }
    showNextImage() {
      // show image at position [this.imgPosition]
      const img = this.images[this.imgPosition];
      // kill any tween on the image
      TweenMax.killTweensOf(img.DOM.el);

      new TimelineMax()
        // show the image
        .set(
          img.DOM.el,
          {
            startAt: { opacity: 0 },
            opacity: 1,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width / 2,
            y: cacheMousePos.y - img.rect.height / 2,
          },
          0
        )
        // animate position
        .to(
          img.DOM.el,
          1.6,
          {
            ease: Expo.easeOut,
            x: mousePos.x - img.rect.width / 2,
            y: mousePos.y - img.rect.height / 2,
          },
          0
        )
        // then make it disappear
        .to(
          img.DOM.el,
          1,
          {
            ease: Power1.easeOut,
            opacity: 0,
          },
          0.4
        )
        // translate down the image
        .to(
          img.DOM.el,
          1,
          {
            ease: Quint.easeInOut,
            y: `+=${winsize.height + img.rect.height / 2}`,
          },
          0.4
        );
    }
  }

  /***********************************/
  /********** Preload stuff **********/

  // Preload images
  const preloadImages = () => {
    return new Promise((resolve, reject) => {
      imagesLoaded(document.querySelectorAll(".content__img"), resolve);
    });
  };

  // And then..
  preloadImages().then(() => {
    // Remove the loader
    document.body.classList.remove("loading");
    new ImageTrail();
  });
}

function loader() {
  var tl = gsap.timeline();
  tl.from("#loader h1, #loading-page", {
    y: "80vh",
    delay: 1,
    duration: 1.5,
  });
  tl.to(" #loading-page", {
    y: "-26%",
  });
  tl.to("#loader, .content", {
    display: "none",
  });
  tl.to("#page1", {
    opacity: 1,
  });
  tl.to("#page2", {
    opacity: 1,
  });
  setTimeout(function () {
    var count = document.querySelector("#loader h1");
    var timer = 0;
    var clear = setInterval(function () {
      if (timer == 100) {
        clearInterval(clear);
      }
      count.innerHTML = timer++;
    }, 8);
  }, 1100);
}

function page2Animation() {
  gsap.utils.toArray(".slide").forEach((part, index) => {
    gsap.to(part, {
      x: index % 2 === 0 ? "-15%" : "10%",
      scale: 1,
      scrollTrigger: {
        trigger: "#page2",
        duration: 2,
        // markers:true,
        start: "top 2%",
        end: "top 2%",
        scrub: 3,
      },
    });
  });
}

function page3Animation() {
  let functionStarted = false;
  var animTl = gsap.timeline({ defaults: { ease: "none" }, paused: true });

  function anima() {
    var maxTime = 4;
    animTl
      .add("p1")
      .to(n1, { y: "-=1990" }, "p1")
      .to(n2, { y: "-=2240" }, "p1")
      .to(n3, { y: "-=1990" }, "p1")
      .to(n4, { y: "-=250" }, "p1");

    gsap.to(animTl, 4, { progress: 1, ease: "power3.inOut" });
  }

  ScrollTrigger.create({
    trigger: "#counter",
    pin: true,
    // markers: true,
    start: "top 85%",
    end: "top 85%",
    onEnter: function () {
      if (!functionStarted) {
        anima();
        functionStarted = true;
      }
    },
  });

  gsap.to(".page-content1 h2", {
    scrollTrigger: {
      trigger: ".page-content1 h2",
      start: "top 75%",
      end: "bottom 21%",
      pin: true,
    //   markers:true,
    },
  });
}

function page4Animation() {
  var elem = document.querySelectorAll(".elem");

  elem.forEach(function (e) {
    e.addEventListener("mouseenter", function () {
      gsap.to(e.querySelector(".overlay"), { x: "100%", duration: 0.3 });
    });
    e.addEventListener("mouseleave", function () {
      gsap.to(e.querySelector(".overlay"), { x: "-100%", duration: 0.3 });
    });
  });
}

function page5Animation() {
  var arrow = document.querySelector("#page5 svg");

  gsap.to(arrow, {
    duration: 1,
    repeat: -1,
    yoyo: true,
    repeatDelay: 0.2,
    scaleY: 0.5,
  });
}

function page6Animation() {
  gsap.to( "#container", {
    clipPath: "circle(14% at 58% 28%)",
    scrollTrigger:{
        trigger: "#container",
        start:"top 10%",
        end:"top 40%",
        // markers:true,
        pin:true,
    }
 });
}


function page8Animation() {
    
    gsap.to("#imagecon img",{
        scale:2,
        scrollTrigger:{
            trigger:"#imagecon img",
            start:"top 100%",
            end:"bottom -100%",
            // markers:true,
            scrub:3,
        }
    })
}

Shery.mouseFollower({
  //Parameters are optional.
  skew: true,
  ease: "cubic-bezier(0.23, 1, 0.320, 1)",
  duration: 0.3,
});


function footerAnimation(){
    gsap.to("#footerdiv",{
        
        clipPath: "polygon(14% 30%, 75% 30%, 54% 64%, 54% 83%, 36% 83%, 36% 63%)",
        scrollTrigger:{
            trigger:"#footer",
            start:"center center",
            end:"center center",
            markers:true,
            // pin:true,
            scrub:3
        }

    })
}
loaderImageAnimation();
loader();
page2Animation();
page3Animation();
page4Animation();
page5Animation();
page6Animation();
page8Animation();
footerAnimation();