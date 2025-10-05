export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface Shape {
  type: 'rectangle' | 'circle' | 'line';
  startPoint: Point;
  endPoint: Point;
  color: string;
  fill?: boolean;
  lineWidth: number;
}

export interface TextElement {
  position: Point;
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
}

export interface ImageElement {
  position: Point;
  width: number;
  height: number;
  url: string;
  fileName: string;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCosmicBackground();
  }

  private drawCosmicBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.8)');
    gradient.addColorStop(1, 'rgba(51, 65, 85, 0.7)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPath(path: DrawingPath) {
    if (path.points.length < 2) return;

    this.ctx.strokeStyle = path.color;
    this.ctx.lineWidth = path.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(path.points[0].x, path.points[0].y);

    for (let i = 1; i < path.points.length; i++) {
      this.ctx.lineTo(path.points[i].x, path.points[i].y);
    }

    this.ctx.stroke();
  }

  drawShape(shape: Shape) {
    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = shape.lineWidth;

    if (shape.fill) {
      this.ctx.fillStyle = shape.color;
    }

    const width = shape.endPoint.x - shape.startPoint.x;
    const height = shape.endPoint.y - shape.startPoint.y;

    switch (shape.type) {
      case 'rectangle':
        if (shape.fill) {
          this.ctx.fillRect(shape.startPoint.x, shape.startPoint.y, width, height);
        } else {
          this.ctx.strokeRect(shape.startPoint.x, shape.startPoint.y, width, height);
        }
        break;

      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = shape.startPoint.x + width / 2;
        const centerY = shape.startPoint.y + height / 2;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

        if (shape.fill) {
          this.ctx.fill();
        } else {
          this.ctx.stroke();
        }
        break;

      case 'line':
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        this.ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        this.ctx.stroke();
        break;
    }
  }

  drawText(textElement: TextElement) {
    this.ctx.fillStyle = textElement.color;
    this.ctx.font = `${textElement.fontSize}px ${textElement.fontFamily || 'Arial'}`;
    this.ctx.fillText(textElement.text, textElement.position.x, textElement.position.y);
  }

  drawImage(imageElement: ImageElement, image: HTMLImageElement) {
    this.ctx.drawImage(
      image,
      imageElement.position.x,
      imageElement.position.y,
      imageElement.width,
      imageElement.height,
    );
  }

  // Utility methods
  getMousePosition(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  isPointInShape(point: Point, shape: Shape): boolean {
    const width = shape.endPoint.x - shape.startPoint.x;
    const height = shape.endPoint.y - shape.startPoint.y;

    return (
      point.x >= shape.startPoint.x &&
      point.x <= shape.startPoint.x + width &&
      point.y >= shape.startPoint.y &&
      point.y <= shape.startPoint.y + height
    );
  }

  exportToDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  exportToBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, 'image/png');
    });
  }
}

export const createTextInput = (
  position: Point,
  onSubmit: (text: string) => void,
  onCancel: () => void,
): HTMLInputElement => {
  const input = document.createElement('input');
  input.type = 'text';
  input.style.position = 'absolute';
  input.style.left = `${position.x}px`;
  input.style.top = `${position.y}px`;
  input.style.zIndex = '1000';
  input.style.background = 'rgba(15, 23, 42, 0.9)';
  input.style.border = '2px solid #3b82f6';
  input.style.borderRadius = '4px';
  input.style.color = 'white';
  input.style.padding = '4px 8px';
  input.style.fontSize = '16px';
  input.style.minWidth = '200px';

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(input.value);
      document.body.removeChild(input);
    } else if (e.key === 'Escape') {
      onCancel();
      document.body.removeChild(input);
    }
  };

  const handleBlur = () => {
    onSubmit(input.value);
    document.body.removeChild(input);
  };

  input.addEventListener('keydown', handleKeyDown);
  input.addEventListener('blur', handleBlur);

  document.body.appendChild(input);
  input.focus();

  return input;
};

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};
