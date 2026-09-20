import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT_DIR = Path("./data/sample")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def create_image(filename: str, bg_color: str, title: str, subtitle: str, lines: list, shapes: list = None):
    img = Image.new("RGB", (900, 600), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Header bar
    draw.rectangle([(0, 0), (900, 70)], fill="#0f172a")
    draw.text((30, 22), title, fill="#38bdf8")

    # Body
    draw.text((40, 95), subtitle, fill="#f8fafc")

    y = 150
    for line in lines:
        draw.text((40, y), line, fill="#e2e8f0")
        y += 35

    # Optional diagram shapes/boxes
    if shapes:
        for s in shapes:
            box = s["box"]
            color = s.get("color", "#3b82f6")
            text = s.get("text", "")
            draw.rounded_rectangle(box, radius=8, fill=color, outline="#ffffff", width=2)
            if text:
                draw.text((box[0] + 15, box[1] + 15), text, fill="#ffffff")

    file_path = OUT_DIR / filename
    img.save(file_path, quality=95)
    print(f"Generated {filename}")

def generate_all():
    # 1. AWS Cloud Architecture Diagram
    create_image(
        "aws-serverless-architecture.png",
        "#1e293b",
        "AWS Cloud Architecture Reference",
        "Serverless Microservices Flow 2025",
        [
            "Components: AWS Lambda, API Gateway, DynamoDB, Amazon S3",
            "Event-driven architecture with EventBridge & SQS queues",
            "PostgreSQL Aurora Serverless for transactional records"
        ],
        shapes=[
            {"box": (50, 320, 220, 420), "color": "#f97316", "text": "API Gateway\nREST Endpoints"},
            {"box": (260, 320, 430, 420), "color": "#eab308", "text": "AWS Lambda\nPython Worker"},
            {"box": (470, 320, 640, 420), "color": "#06b6d4", "text": "DynamoDB\nNoSQL Store"},
            {"box": (680, 320, 850, 420), "color": "#3b82f6", "text": "Amazon S3\nObject Storage"}
        ]
    )

    # 2. Python Dijkstra Algorithm Screenshot
    create_image(
        "python-dijkstra-code.png",
        "#0f172a",
        "VSCode - algorithm.py",
        "def dijkstra(graph, start_node):",
        [
            "import heapq",
            "distances = {node: float('inf') for node in graph}",
            "distances[start_node] = 0",
            "pq = [(0, start_node)]",
            "while pq:",
            "    curr_dist, u = heapq.heappop(pq)",
            "    for v, weight in graph[u].items():",
            "        if curr_dist + weight < distances[v]:",
            "            distances[v] = curr_dist + weight",
            "            heapq.heappush(pq, (distances[v], v))",
            "return distances"
        ]
    )

    # 3. Handwritten DSA Notes
    create_image(
        "handwritten-dsa-notes.png",
        "#fffbeb",
        "DSA Notes - Binary Search Tree",
        "BST Traversal & Invariant Properties",
        [
            "In-order traversal of BST yields sorted array elements.",
            "Pre-order traversal: Root -> Left Subtree -> Right Subtree",
            "Post-order traversal: Useful for node deletion and memory cleanup.",
            "Time Complexity: O(log N) average search, O(N) worst case skew.",
            "Balanced variants: AVL Trees, Red-Black Trees."
        ]
    )

    # 4. Tech Conference Presentation
    create_image(
        "keynote-presentation-ai.png",
        "#18181b",
        "Global AI Summit 2025 Keynote",
        "Ayush Pal Presenting: Modern Multimodal Information Retrieval",
        [
            "Slide 12: Hybrid Search with OpenCLIP and Vector Databases",
            "Combining dense vector representation with sparse lexical signals",
            "Cross-Encoder Re-ranking to maximize Mean Reciprocal Rank (MRR)",
            "Audience Q&A on low-latency vector quantization (HNSW & IVFPQ)"
        ],
        shapes=[
            {"box": (60, 340, 400, 520), "color": "#8b5cf6", "text": "Speaker Stage\nAyush Pal Presenting"},
            {"box": (440, 340, 840, 520), "color": "#ec4899", "text": "Main Projection Display\nMultimodal Memory AI"}
        ]
    )

    # 5. Red Sports Car
    create_image(
        "red-sports-car-photo.jpg",
        "#7f1d1d",
        "Automotive Showcase",
        "Ferrari SF90 Stradale - Rosso Corsa Red Car",
        [
            "V8 Twin-Turbo Plug-in Hybrid Supercar",
            "Exterior: Vibrant Glossy Crimson Red with Carbon Fiber Trim",
            "Captured at Monaco Motor Expo 2025"
        ],
        shapes=[
            {"box": (150, 320, 750, 500), "color": "#dc2626", "text": "Red Ferrari Supercar Body"}
        ]
    )

    # 6. Machine Learning Architecture
    create_image(
        "ml-feature-store-pipeline.png",
        "#042f2e",
        "MLOps System Design",
        "Real-Time Feature Store and Model Serving Pipeline",
        [
            "Streaming ingestion from Apache Kafka to Feast Feature Store",
            "Offline batch training on GPU cluster with PyTorch & Ray",
            "Online low-latency inference endpoint with FastAPI and Triton",
            "Model Registry with MLflow and automated canary deployments"
        ]
    )

    # 7. PostgreSQL Database Schema Diagram
    create_image(
        "postgresql-database-diagram.png",
        "#172554",
        "PostgreSQL 16 Relational Schema",
        "Database Tables & Foreign Key Constraints",
        [
            "Table users (id UUID PK, email VARCHAR, created_at TIMESTAMPTZ)",
            "Table images (id UUID PK, filename VARCHAR, phash VARCHAR)",
            "Table ocr_results (image_id UUID FK, text TEXT, confidence FLOAT)",
            "Index idx_images_hash ON images USING btree (file_hash)"
        ]
    )

    # 8. Exact Duplicate of Red Car
    import shutil
    shutil.copyfile(OUT_DIR / "red-sports-car-photo.jpg", OUT_DIR / "red-sports-car-photo-copy.jpg")
    print("Generated red-sports-car-photo-copy.jpg (Exact duplicate)")

    # 9. Near Duplicate of AWS Architecture (slight color / dimension tweak)
    create_image(
        "aws-serverless-architecture-v2.png",
        "#1e293b",
        "AWS Cloud Architecture Reference",
        "Serverless Microservices Flow 2025 (Revision 2)",
        [
            "Components: AWS Lambda, API Gateway, DynamoDB, Amazon S3",
            "Event-driven architecture with EventBridge & SQS queues",
            "PostgreSQL Aurora Serverless for transactional records"
        ],
        shapes=[
            {"box": (52, 322, 222, 422), "color": "#ea580c", "text": "API Gateway\nREST Endpoints"},
            {"box": (262, 322, 432, 422), "color": "#ca8a04", "text": "AWS Lambda\nPython Worker"},
            {"box": (472, 322, 642, 422), "color": "#0891b2", "text": "DynamoDB\nNoSQL Store"},
            {"box": (682, 322, 852, 422), "color": "#2563eb", "text": "Amazon S3\nObject Storage"}
        ]
    )

if __name__ == "__main__":
    generate_all()
