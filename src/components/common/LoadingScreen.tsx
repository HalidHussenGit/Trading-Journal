import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#ffffff',
      zIndex: 9999,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Fazers + speeder directly in the fixed full-screen div.
          .lf-loader uses position:absolute; top:50%; left:50%; margin-left:-50px
          relative to THIS element = true viewport center. No nested containers. */}
      <div className="lf-longfazers">
        <span /><span /><span /><span />
      </div>

      <div className="lf-loader">
        <span>
          <span /><span /><span /><span />
          <div className="lf-base">
            <span />
          </div>
          <div className="lf-face" />
        </span>
      </div>

      <style>{`
        /* ── Speeder (uiverse.io / anand_4957) — emerald recolor ── */
        .lf-loader {
          position: absolute;
          top: 50%;
          margin-left: -170px;
          left: 50%;
          animation: lf-speeder 0.4s linear infinite;
        }
        .lf-loader > span {
          height: 5px;
          width: 35px;
          background: #10b981;
          position: absolute;
          top: -19px;
          left: 60px;
          border-radius: 2px 10px 1px 0;
        }
        .lf-base span {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-right: 100px solid #10b981;
          border-bottom: 6px solid transparent;
        }
        .lf-base span:before {
          content: "";
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #10b981;
          position: absolute;
          right: -110px;
          top: -16px;
        }
        .lf-base span:after {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-top: 0 solid transparent;
          border-right: 55px solid #10b981;
          border-bottom: 16px solid transparent;
          top: -16px;
          right: -98px;
        }
        .lf-face {
          position: absolute;
          height: 12px;
          width: 20px;
          background: #10b981;
          border-radius: 20px 20px 0 0;
          transform: rotate(-40deg);
          right: -125px;
          top: -15px;
        }
        .lf-face:after {
          content: "";
          height: 12px;
          width: 12px;
          background: #10b981;
          right: 4px;
          top: 7px;
          position: absolute;
          transform: rotate(40deg);
          transform-origin: 50% 50%;
          border-radius: 0 0 0 2px;
        }
        .lf-loader > span > span:nth-child(1),
        .lf-loader > span > span:nth-child(2),
        .lf-loader > span > span:nth-child(3),
        .lf-loader > span > span:nth-child(4) {
          width: 30px;
          height: 1px;
          background: #10b981;
          position: absolute;
          animation: lf-fazer1 0.2s linear infinite;
        }
        .lf-loader > span > span:nth-child(2) {
          top: 3px;
          animation: lf-fazer2 0.4s linear infinite;
        }
        .lf-loader > span > span:nth-child(3) {
          top: 1px;
          animation: lf-fazer3 0.4s linear infinite;
          animation-delay: -1s;
        }
        .lf-loader > span > span:nth-child(4) {
          top: 4px;
          animation: lf-fazer4 1s linear infinite;
          animation-delay: -1s;
        }

        .lf-longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .lf-longfazers span {
          position: absolute;
          height: 2px;
          width: 20%;
          background: #10b981;
          opacity: 0.25;
        }
        .lf-longfazers span:nth-child(1) {
          top: 20%;
          animation: lf-lf 0.6s linear infinite;
          animation-delay: -5s;
        }
        .lf-longfazers span:nth-child(2) {
          top: 40%;
          animation: lf-lf2 0.8s linear infinite;
          animation-delay: -1s;
        }
        .lf-longfazers span:nth-child(3) {
          top: 60%;
          animation: lf-lf3 0.6s linear infinite;
        }
        .lf-longfazers span:nth-child(4) {
          top: 80%;
          animation: lf-lf4 0.5s linear infinite;
          animation-delay: -3s;
        }

        @keyframes lf-fazer1 { 0%{left:0} 100%{left:-80px;opacity:0} }
        @keyframes lf-fazer2 { 0%{left:0} 100%{left:-100px;opacity:0} }
        @keyframes lf-fazer3 { 0%{left:0} 100%{left:-50px;opacity:0} }
        @keyframes lf-fazer4 { 0%{left:0} 100%{left:-150px;opacity:0} }

        @keyframes lf-speeder {
          0%   { transform: translate(2px,1px)   rotate(0deg)  }
          10%  { transform: translate(-1px,-3px) rotate(-1deg) }
          20%  { transform: translate(-2px,0px)  rotate(1deg)  }
          30%  { transform: translate(1px,2px)   rotate(0deg)  }
          40%  { transform: translate(1px,-1px)  rotate(1deg)  }
          50%  { transform: translate(-1px,3px)  rotate(-1deg) }
          60%  { transform: translate(-1px,1px)  rotate(0deg)  }
          70%  { transform: translate(3px,1px)   rotate(-1deg) }
          80%  { transform: translate(-2px,-1px) rotate(1deg)  }
          90%  { transform: translate(2px,1px)   rotate(0deg)  }
          100% { transform: translate(1px,-2px)  rotate(-1deg) }
        }

        @keyframes lf-lf  { 0%{left:200%} 100%{left:-200%;opacity:0} }
        @keyframes lf-lf2 { 0%{left:200%} 100%{left:-200%;opacity:0} }
        @keyframes lf-lf3 { 0%{left:200%} 100%{left:-100%;opacity:0} }
        @keyframes lf-lf4 { 0%{left:200%} 100%{left:-100%;opacity:0} }
      `}</style>
    </div>
  );
};
