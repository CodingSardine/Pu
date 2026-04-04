function ModeEatMode({ className }: { className?: string }) {
  return (
    <div className={className || "absolute h-[214px] leading-none left-[131px] top-[47px] w-[153px]"} data-name="Mode/Eat Mode">
      <p className="absolute left-0 text-[54.309px] text-[rgba(255,255,255,0.8)] text-shadow-[0px_0px_8.9px_#3c787e,0px_0px_17.8px_#3c787e,0px_0px_62.3px_#3c787e,0px_0px_124.6px_#3c787e,0px_0px_213.6px_#3c787e,0px_0px_250px_#3c787e] top-[13px] w-[105px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        EAT
      </p>
      <p className="absolute left-0 text-[#828282] text-[37.159px] top-[97px] w-[129px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        FOCUS
      </p>
      <p className="absolute left-0 text-[#828282] text-[37.159px] top-[164px] w-[105px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        CHILL
      </p>
    </div>
  );
}

function ModeFocusMode({ className }: { className?: string }) {
  return (
    <div className={className || "absolute h-[240px] leading-[0] left-[113px] top-[300px] w-[171px]"} data-name="Mode/Focus Mode">
      <div className="-translate-y-1/2 absolute flex flex-col justify-center left-0 text-[54.309px] text-[rgba(255,255,255,0.8)] text-shadow-[0px_0px_16.02px_#bf1a2f,0px_0px_32.04px_#bf1a2f,0px_0px_112.14px_#bf1a2f,0px_0px_224.28px_#bf1a2f,0px_0px_250px_#bf1a2f,0px_0px_250px_#bf1a2f] top-[53px] w-[179px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-none">FOCUS</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col justify-center left-[54.5px] text-[#828282] text-[37.159px] text-center top-[195.5px] w-[109px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-none">CHILL</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col h-[37px] justify-center left-[38.5px] text-[#828282] text-[37.159px] text-center top-[128.5px] w-[77px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-none">EAT</p>
      </div>
    </div>
  );
}

function ModeChillMode({ className }: { className?: string }) {
  return (
    <div className={className || "absolute h-[214px] leading-none left-[121px] top-[579px] w-[173.278px]"} data-name="Mode/Chill Mode">
      <p className="absolute h-[54px] left-0 text-[54.309px] text-[rgba(255,255,255,0.8)] text-shadow-[0px_0px_3.418px_#5b5bea,0px_0px_6.835px_#5b5bea,0px_0px_23.923px_#5b5bea,0px_0px_47.846px_#5b5bea,0px_0px_82.022px_#5b5bea,0px_0px_143.539px_#5b5bea] top-[13px] w-[153.278px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        CHILL
      </p>
      <p className="absolute h-[37px] left-0 text-[#828282] text-[37.159px] top-[89px] w-[71.694px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        EAT
      </p>
      <p className="absolute h-[37px] left-0 text-[#828282] text-[37.159px] top-[148px] w-[130px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        FOCUS
      </p>
    </div>
  );
}

export default function Mode() {
  return (
    <div className="border border-[#8a38f5] border-solid font-['Roboto:Medium',sans-serif] font-medium overflow-clip relative rounded-[5px] size-full" data-name="Mode">
      <ModeEatMode />
      <ModeFocusMode />
      <ModeChillMode />
    </div>
  );
}