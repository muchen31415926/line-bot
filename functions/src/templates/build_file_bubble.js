import { formatSize } from "#utils";

export function buildFileBubble(fileInfo, title) {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#3d3d3d",
      paddingAll: "md",
      contents: [
        {
          type: "text",
          color: "#dcbc90",
          weight: "bold",
          size: "lg",
          text: `${title}${
            fileInfo.similarity != null
              ? `${(fileInfo.similarity * 100).toFixed(2)}%`
              : ""
          }`,
          offsetTop: "sm",
        },
      ],
      background: {
        type: "linearGradient",
        angle: "45deg",
        startColor: "#1e1e1c",
        endColor: "#252525",
        centerColor: "#3d3d3d",
      },
      margin: "none",
      height: "50px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "md",
      contents: [
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: fileInfo.file_name ?? fileInfo.fileName,
              size: "xl",
              wrap: false,
              flex: 5,
              weight: "bold",
              color: "#555451",
              margin: "lg",
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "📦 大小：",
              size: "sm",
              color: "#555451",
              flex: 2,
              weight: "bold",
              margin: "lg",
            },
            {
              type: "text",
              text: formatSize(fileInfo.file_size ?? fileInfo.fileSize),
              size: "sm",
              color: "#555451",
              wrap: true,
              flex: 6,
              weight: "bold",
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "🏷️ 類型：",
              size: "sm",
              color: "#555451",
              flex: 2,
              weight: "bold",
              margin: "lg",
            },
            {
              type: "text",
              text: (fileInfo.extension ?? fileInfo.ext)?.toUpperCase(),
              size: "sm",
              color: "#555451",
              wrap: true,
              flex: 6,
              weight: "bold",
            },
          ],
        },
      ],
      background: {
        type: "linearGradient",
        angle: "135deg",
        endColor: "#aa802c",
        centerColor: "#fbdc9b",
        startColor: "#ebb156",
      },
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "xxl",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#3d3d3d",
          action: {
            type: "uri",
            label: "⬇️ 下載檔案",
            uri: encodeURI(fileInfo.download_url ?? fileInfo.downloadURL),
          },
          margin: "none",
          offsetTop: "none",
          offsetBottom: "none",
          offsetStart: "none",
        },
      ],
      paddingTop: "sm",
      paddingBottom: "xxl",
      paddingStart: "xxl",
      paddingEnd: "xxl",
      background: {
        type: "linearGradient",
        angle: "40deg",
        startColor: "#ebb156",
        endColor: "#aa802c",
        centerColor: "#fbdc9b",
      },
    },
    styles: {
      header: {
        backgroundColor: "#3d3d3d",
      },
    },
  };
}
