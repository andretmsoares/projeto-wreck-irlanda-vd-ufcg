echarts.registerMap('coastline', COASTLINE);

const COLORS = [
  '#c99a30', '#4a9e97', '#c1543a', '#8a6ad0', '#7fae5c',
  '#d47fa8', '#5b9bd5', '#e0a15c', '#6ecbd1', '#b06a9e',
  '#8fbf6a', '#d16b6b', '#5f8fd4', '#c9c25a', '#9a7bd0'
];
const colorOf = {};
DATA.classifications.forEach((c,i)=> colorOf[c] = COLORS[i % COLORS.length]);

// points: [lon, lat, classification, year, wreck_name, place_of_loss, description]
let activeCls = new Set(DATA.classifications);
let yearFrom = DATA.yearMin, yearTo = DATA.yearMax;
let includeUnknownYear = true;

const dom = document.getElementById('map');
const chart = echarts.init(dom, null, {renderer:'canvas'});

function filteredData(){
  return DATA.points.filter(p=>{
    if(!activeCls.has(p[2])) return false;
    if(p[3] === null){ return includeUnknownYear; }
    return p[3] >= yearFrom && p[3] <= yearTo;
  });
}

function buildSeries(){
  // group by classification for legend-consistent coloring
  const byCls = {};
  filteredData().forEach(p=>{
    if(!byCls[p[2]]) byCls[p[2]] = [];
    byCls[p[2]].push({
      name: p[4],
      value: [p[0], p[1]],
      year: p[3],
      place: p[5],
      desc: p[6],
      cls: p[2]
    });
  });
  return Object.keys(byCls).map(cls=>({
    name: cls,
    type:'scatter',
    coordinateSystem:'geo',
    symbolSize: 6,
    itemStyle:{
      color: colorOf[cls],
      opacity:0.75,
      borderColor:'rgba(15,36,54,0.6)',
      borderWidth:0.5
    },
    emphasis:{
      scale:1.8,
      itemStyle:{opacity:1, borderColor:'#e9e2cd', borderWidth:1.2}
    },
    data: byCls[cls]
  }));
}

function option(){
  return {
    backgroundColor:'transparent',
    // Full replace on filter (setOption notMerge) re-creates every series.
    // Enter animation then replays for points that stayed visible (esp. unknown-year),
    // which looks like dots jumping between locations.
    animation: false,
    textStyle:{fontFamily:'Georgia, serif'},
    geo:{
      map:'coastline',
      roam:true,
      zoom: 1.15,
      center:[-9.5, 53.2],
      itemStyle:{
        areaColor:'#173049',
        borderColor:'#2c5470',
        borderWidth:0.8
      },
      emphasis:{disabled:true},
      silent:true,
      label:{show:false}
    },
    tooltip:{
      trigger:'item',
      backgroundColor:'#0f2436',
      borderColor:'#24445c',
      borderWidth:1,
      textStyle:{color:'#e9e2cd', fontSize:12, fontFamily:'Georgia, serif'},
      extraCssText:'max-width:300px; white-space:normal; line-height:1.5; box-shadow:0 8px 22px rgba(0,0,0,.4);',
      formatter:function(p){
        if(p.componentType !== 'series') return '';
        const d = p.data;
        let out = '<div style="font-family:ui-monospace,monospace;color:#c99a30;letter-spacing:.05em;font-size:11px;margin-bottom:4px;">'+ (d.cls||'').toUpperCase() +' · '+ (d.year!==null? d.year : 'ANO DESCONHECIDO') +'</div>';
        out += '<div style="font-weight:600;margin-bottom:4px;">'+ (d.name||'Sem nome') +'</div>';
        if(d.place) out += '<div style="font-size:11.5px;color:#9db0be;margin-bottom:5px;">'+d.place+'</div>';
        if(d.desc) out += '<div style="font-size:12px;color:#cdd6dc;">'+d.desc+'</div>';
        return out;
      }
    },
    series: buildSeries()
  };
}

function render(){
  const opt = option();
  const prev = chart.getOption();
  if (prev && prev.geo && prev.geo[0]) {
    if (prev.geo[0].center) opt.geo.center = prev.geo[0].center;
    if (prev.geo[0].zoom != null) opt.geo.zoom = prev.geo[0].zoom;
  }
  chart.setOption(opt, true);
  updateCountLabel();
}

function updateCountLabel(){
  document.getElementById('countLabel').textContent = filteredData().length + ' NAUFRÁGIO(S) VISÍVEL(EIS)';
}

function buildChipList(){
  const list = document.getElementById('chipList');
  list.innerHTML = '';
  const counts = {};
  DATA.points.forEach(p=>{ counts[p[2]] = (counts[p[2]]||0)+1; });
  DATA.classifications.slice().sort((a,b)=>(counts[b]||0)-(counts[a]||0)).forEach(c=>{
    const el = document.createElement('div');
    el.className = 'chip' + (activeCls.has(c) ? ' active' : '');
    el.innerHTML = '<span class="swatch" style="background:'+colorOf[c]+'"></span>' +
                    '<span class="name">'+c+'</span>' +
                    '<span class="count">'+(counts[c]||0)+'</span>';
    el.addEventListener('click', ()=>{
      if(activeCls.has(c)){ activeCls.delete(c); } else { activeCls.add(c); }
      buildChipList();
      render();
    });
    list.appendChild(el);
  });
}

document.getElementById('allBtn').addEventListener('click', ()=>{
  activeCls = new Set(DATA.classifications);
  buildChipList(); render();
});
document.getElementById('noneBtn').addEventListener('click', ()=>{
  activeCls = new Set();
  buildChipList(); render();
});

const yfInput = document.getElementById('yearFrom');
const ytInput = document.getElementById('yearTo');
const yfRange = document.getElementById('yearFromRange');
const ytRange = document.getElementById('yearToRange');
const unkCheck = document.getElementById('includeUnknownYear');

[yfInput, ytInput, yfRange, ytRange].forEach(el=>{
  el.min = DATA.yearMin; el.max = DATA.yearMax;
});
yfInput.value = DATA.yearMin; ytInput.value = DATA.yearMax;
yfRange.value = DATA.yearMin; ytRange.value = DATA.yearMax;

function syncFromInputs(){
  yearFrom = Math.min(Number(yfInput.value), Number(ytInput.value));
  yearTo = Math.max(Number(yfInput.value), Number(ytInput.value));
  yfRange.value = yearFrom; ytRange.value = yearTo;
  render();
}
function syncFromRanges(){
  yearFrom = Math.min(Number(yfRange.value), Number(ytRange.value));
  yearTo = Math.max(Number(yfRange.value), Number(ytRange.value));
  yfInput.value = yearFrom; ytInput.value = yearTo;
  render();
}
yfInput.addEventListener('change', syncFromInputs);
ytInput.addEventListener('change', syncFromInputs);
yfRange.addEventListener('input', syncFromRanges);
ytRange.addEventListener('input', syncFromRanges);
unkCheck.addEventListener('change', ()=>{ includeUnknownYear = unkCheck.checked; render(); });

buildChipList();
render();
window.addEventListener('resize', ()=>chart.resize());
