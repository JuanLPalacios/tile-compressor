/* eslint-disable no-console */
export interface ITile {
  coords: {
    x: number,
    y: number
  }[],
  tileData: ImageData,
  times: number,
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

const d = function (a, b) {
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

export function reduceTiles(tiles) {
  let k = 192;

  let B = Object.values(tiles);
  let h = B[0];
  for (let x = 0; x < k; x++) {
    let dx = 0;
    let cx = h;
    let index = 0
    let Bjx = B[0];
    for (let j = 0; j < B.length; j++) {
      const Bj = B[j];
      const BjMap = Object.values(Bj);
      for (let i = 0; i < BjMap.length; i++) {
        const BjMapi = BjMap[i];
        const ci = Bj[BjMapi];
        const di = d(ci, Bj[BjMap[0]])
        if (di > dx) {
          dx = di;
          cx = ci
          index = BjMapi
          Bjx = Bj;
        }
      }
    }
    let Bx = {};
    B.push(Bx)
    delete Bjx[index];
    Bx[index] = cx;
    h = cx;
    for (let j = 0; j < B.length; j++) {
      const Bj = B[j];
      const BjMap = Object.values(Bj);
      for (let i = 0; i < BjMap.length; i++) {
        const BjMapi = BjMap[i];
        const ci = Bj[BjMapi];
        const di = d(ci, Bj[BjMap[0]])
        if (di > d(ci, h)) {
          delete Bj[BjMapi];
          Bx[BjMapi] = ci;
        }
      }
    }
  }
  tiles = {};
  let uuid = 0;
  for (let y = 0; y < B.length; y += 1) {
    const cluster = B[y];
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