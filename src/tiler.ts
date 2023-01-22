/* eslint-disable no-console */
export interface ITile {
  coords: {
    x: number,
    y: number
  }[],
  tileData: ImageData,
  times: number,
  vector: number[],
  uuid: number
}

export function mapTiles(img: HTMLImageElement, width = 8, height = 8): { [key: string]: ITile } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = Math.ceil(img.width / width) * 8;
  canvas.height = Math.ceil(img.height / height) * 8;
  canvas.style.width = `${Math.ceil(img.width / width) * 8 * 2}px`;
  canvas.style.height = `${Math.ceil(img.height / height) * 8 * 2}px`;

  ctx.fillStyle = '#e0f8cf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  img.onload = null;

  const tiles = {};
  let uuid = 0;
  for (let y = 0; y < img.height; y += 8) {
    for (let x = 0; x < img.width; x += 8) {
      const tileData = ctx.getImageData(x, y, width, height);
      const index = tileData.data.toString();
      if (tiles[index]) {
        tiles[index].coords.push({ x: x / width, y: y / height });
        tiles[index].times++;
      } else {
        tiles[index] = {
          uuid: uuid++,
          coords: [{ x: x / width, y: y / height }],
          times: 1,
          tileData: tileData
        };
      }
    }
  }
  return tiles;
}

var tileCanvasa = document.createElement("canvas");
tileCanvasa.width = 8;
tileCanvasa.height = 8;
var ctxa = tileCanvasa.getContext("2d");
var tileCanvasb = document.createElement("canvas");
tileCanvasb.width = 8;
tileCanvasb.height = 8;
var ctxb = tileCanvasb.getContext("2d");

const distance = function (a, b) {
  ctxa.putImageData(a.tileData, 0, 0);
  ctxb.putImageData(b.tileData, 0, 0);

  ctxa.globalAlpha = 1;
  ctxa.globalCompositeOperation = 'difference';

  ctxa.drawImage(tileCanvasb, 0, 0);
  const rd = ctxa.getImageData(0, 0, 8, 8);
  let dr = 0, db = 0, dg = 0;
  for (let x = 0; x < rd.data.length; x++) {
    const v = rd.data[x];
    switch (x % 3) {
      case 0:
        dr += v;
        break;
      case 1:
        dg += v;
        break;
      case 2:
        db += v;
        break;

      default:
        break;
    }
  }
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

const mix = function (a, b, rate) {
  ctxa.putImageData(a.tileData, 0, 0);
  ctxb.putImageData(b.tileData, 0, 0);
  ctxa.globalAlpha = rate;

  ctxa.globalCompositeOperation = 'source-over';

  ctxa.drawImage(tileCanvasb, 0, 0);
  return ctxa.getImageData(0, 0, 8, 8);
}

const consolidate = function (cluster) {
  const tile = {
    uuid: NaN,
    coords: [],
    times: 0,
    tileData: ctxa.getImageData(0, 0, 8, 8)//rubish data gets repaced in firt cicle
  };
  for (let x = 0; x < cluster.length; x++) {
    const element = cluster[x];
    tile.times += element.times;
    tile.coords.push(...element.coords)
  }
  let rate = 1;
  for (let x = 0; x < cluster.length; x++) {
    const element = cluster[x];
    tile.tileData = mix(tile, element, rate);
    rate -= element.times / tile.times;
  }
  return tile
}


export const rgbToHsv = ([r, g, b]:[number,number,number] ) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const v = Math.max(r,g,b);
  const min = Math.min(r,g,b);
  let d = v-min;
  let s = (v == 0) ? 0 : d / v;
  let h = 0;
  if(v !== min){
    switch(v){
      case r: h = (g - b) / d + ((g < b) ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
};

export const hsvDistance = ([h1, s1, v1]:[number,number,number], [h2, s2, v2]:[number,number,number] ) => {
  return ( Math.sin(h1)*s1*v1 - Math.sin(h2)*s2*v2 )^2
  + ( Math.cos(h1)*s1*v1 - Math.cos(h2)*s2*v2 )**2
  + ( v1 - v2 )**2;
};

export const rgbToYuv = ([r, g, b]:[number,number,number] ) => {
  const 
  y = 0.299*r + 0.587*g + 0.114*b,
  u = -0.14713*r - 0.288862*g + 0.436*b,
  v = 0.615*r - 0.51498*g - 0.10001*b;
  return [y, u, v];
};

export const euclideanDistance = (v1:number[], v2:number[] ) => {
  return Math.sqrt(v1.reduce((total, x1, i)=>total+( x1 - v2[i] )**2, 0));
};

export const KMeansPlusPlus = (points:ITile[], k:number) => {
  var centroids:number[][] = [];
  var clusters:ITile[][] = new Array(points.length);
  var visited = new Array(points.length).fill(false);

  // Randomly choose the first centroid
  var randomIndex = Math.floor(Math.random() * points.length);
  centroids.push(points[randomIndex].vector);
  visited[randomIndex] = true;

  // Select the remaining k-1 centroids
  for (var i = 1; i < k; i++) {
      var distances = [];
      for (var j = 0; j < points.length; j++) {
          if (visited[j]) continue;

          var minDistance = Number.MAX_VALUE;
          for (var c = 0; c < centroids.length; c++) {
              var distance = euclideanDistance(points[j].vector, centroids[c]);
              if (distance < minDistance) {
                  minDistance = distance;
              }
          }
          distances.push([j, minDistance]);
      }

      // Select the next centroid based on the minimum distance to the closest centroid
      distances.sort(function(a, b) { return b[1] - a[1] });
      var nextCentroidIndex = distances[0][0];
      centroids.push(points[nextCentroidIndex].vector);
      visited[nextCentroidIndex] = true;
  }

  // Assign each point to the closest centroid
  for (var i = 0; i < points.length; i++) {
      var minDistance = Number.MAX_VALUE;
      var closestCentroid;
      for (var j = 0; j < k; j++) {
          var distance = euclideanDistance(points[i].vector, centroids[j]);
          if (distance < minDistance) {
              minDistance = distance;
              closestCentroid = j;
          }
      }
      if (!clusters[closestCentroid]) {
          clusters[closestCentroid] = [];
      }
      clusters[closestCentroid].push(points[i]);
  }

  return clusters;
}

export function MBSAS(tiles:Map<string,ITile>) {
  // my targget number of clusters
  let k = 192;

  let points = <ITile[]>Object.values(tiles);//original set
  let center = points[0];// select a random point

  for (let x = 0; x < k; x++) {//untill k is met
    let maxDistanceFromLastCluster = 0;
    let lastClusterCenter = center;
    let selectedFardestPointIndex = 0
    let Bjx = points[0];
    // from all not currently cluster centers
    for (let j = 0; j < points.length; j++) {
      const currentPoint = points[j];
      const BjMap = Object.values(currentPoint);
      for (let i = 0; i < BjMap.length; i++) {
        const BjMapi = BjMap[i];
        const ci = currentPoint[BjMapi];
        const di = distance(ci, currentPoint[BjMap[0]])
        if (di > maxDistanceFromLastCluster) {
          maxDistanceFromLastCluster = di;
          lastClusterCenter = ci
          selectedFardestPointIndex = BjMapi
          Bjx = currentPoint;
        }
      }
    }
    let Bx = {};
    points.push(Bx)
    delete Bjx[selectedFardestPointIndex];
    Bx[selectedFardestPointIndex] = lastClusterCenter;
    center = lastClusterCenter;
    for (let j = 0; j < points.length; j++) {
      const Bj = points[j];
      const BjMap = Object.values(Bj);
      for (let i = 0; i < BjMap.length; i++) {
        const BjMapi = BjMap[i];
        const ci = Bj[BjMapi];
        const di = distance(ci, Bj[BjMap[0]])
        if (di > distance(ci, center)) {
          delete Bj[BjMapi];
          Bx[BjMapi] = ci;
        }
      }
    }
  }
  tiles = {};
  let uuid = 0;
  for (let y = 0; y < points.length; y += 1) {
    const cluster = points[y];
    const tile = consolidate(cluster);
    const index = tile.tileData.data.toString();
    tiles[index] = { ...tile, uuid: uuid++ };
    for (let x = 0; x < tile.coords.length; x++) {
      const coord = tile.coords[x];
      ctxa.putImageData(tile.tileData, coord.x, coord.y);
    }
  }

  const uniqueTiles = Object.values(tiles).length;
  document.querySelector("#unique-tiles").value = uniqueTiles;
  document.querySelector("#width").value = img.width;
  document.querySelector("#height").value = img.height;

  document.querySelector('#tiles').innerHTML = "";
  Object.values(tiles).map((t, i) => {
    var tileCanvas = document.createElement("canvas");
    tileCanvas.width = 8;
    tileCanvas.height = 8;
    tileCanvas.setAttribute("data-index", t.uuid);
    var tileCtx = tileCanvas.getContext("2d");
    tileCtx.putImageData(t.tileData, 0, 0);
    document.querySelector('#tiles')
      .appendChild(document.createElement("span"))
      .appendChild(tileCanvas);
  });

};
img.src = reader.result;
  };
reader.readAsDataURL(File);
)