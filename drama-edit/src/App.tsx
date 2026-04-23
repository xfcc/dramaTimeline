import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

import { dramaSchema, dynastySchema } from "@shared-validation";

const dynastiesFileSchema = z.array(dynastySchema);
const dramasFileSchema = z.array(dramaSchema);

type Tab = "dynasties" | "dramas";

function formatJsonLabel(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function validatePair(dynastiesJson: string, dramasJson: string): string | null {
  let dynParsed: unknown;
  let dramParsed: unknown;
  try {
    dynParsed = JSON.parse(dynastiesJson);
  } catch {
    return "dynasties.json：JSON 语法错误";
  }
  try {
    dramParsed = JSON.parse(dramasJson);
  } catch {
    return "dramas.json：JSON 语法错误";
  }

  const dynResult = dynastiesFileSchema.safeParse(dynParsed);
  if (!dynResult.success) {
    return `dynasties.json：${dynResult.error.issues[0]?.message ?? "校验失败"}`;
  }

  const dramResult = dramasFileSchema.safeParse(dramParsed);
  if (!dramResult.success) {
    return `dramas.json：${dramResult.error.issues[0]?.message ?? "校验失败"}`;
  }

  const dynastyIds = new Set(dynResult.data.map((d) => d.id));
  for (const d of dramResult.data) {
    if (!dynastyIds.has(d.dynasty_id)) {
      return `dramas.json：剧集「${d.title}」的 dynasty_id「${d.dynasty_id}」在 dynasties.json 中不存在`;
    }
  }

  return null;
}

export function App() {
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [dynastiesJson, setDynastiesJson] = useState("");
  const [dramasJson, setDramasJson] = useState("");
  const [tab, setTab] = useState<Tab>("dynasties");
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => window.dramaEdit, []);

  const openFolder = useCallback(async () => {
    setMessage(null);
    setLoading(true);
    try {
      const dir = await api.selectDataDir();
      if (!dir) {
        setLoading(false);
        return;
      }
      const { dynastiesJson: d, dramasJson: dr } = await api.readDataFiles(dir);
      setDataDir(dir);
      setDynastiesJson(formatJsonLabel(d));
      setDramasJson(formatJsonLabel(dr));
      setMessage({ type: "ok", text: "已加载数据文件夹。" });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e instanceof Error
            ? e.message
            : "无法读取 dynasties.json / dramas.json，请确认所选文件夹。",
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  const runValidate = useCallback(() => {
    setMessage(null);
    const err = validatePair(dynastiesJson, dramasJson);
    if (err) {
      setMessage({ type: "error", text: err });
      return false;
    }
    setMessage({ type: "ok", text: "校验通过，可以保存。" });
    return true;
  }, [dynastiesJson, dramasJson]);

  const save = useCallback(async () => {
    setMessage(null);
    if (!dataDir) {
      setMessage({ type: "error", text: "请先选择数据文件夹。" });
      return;
    }
    const err = validatePair(dynastiesJson, dramasJson);
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    setLoading(true);
    try {
      const outDyn = `${JSON.stringify(JSON.parse(dynastiesJson), null, 2)}\n`;
      const outDr = `${JSON.stringify(JSON.parse(dramasJson), null, 2)}\n`;
      await api.writeDataFiles(dataDir, outDyn, outDr);
      setMessage({ type: "ok", text: "已保存到磁盘。" });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "保存失败",
      });
    } finally {
      setLoading(false);
    }
  }, [api, dataDir, dynastiesJson, dramasJson]);

  const onChangeDyn = (v: string) => {
    setDynastiesJson(v);
    setMessage(null);
  };
  const onChangeDram = (v: string) => {
    setDramasJson(v);
    setMessage(null);
  };

  return (
    <>
      <header className="toolbar">
        <button type="button" className="primary" onClick={openFolder} disabled={loading}>
          选择数据文件夹…
        </button>
        <button type="button" onClick={runValidate} disabled={loading || !dataDir}>
          校验
        </button>
        <button
          type="button"
          className="primary"
          onClick={save}
          disabled={loading || !dataDir}
        >
          保存
        </button>
        <span className="path-label">
          {dataDir ? dataDir : "请选择包含 dynasties.json 与 dramas.json 的目录（可与仓库内 data/ 相同）"}
        </span>
      </header>

      {message ? (
        <p className={`msg ${message.type === "error" ? "error" : "ok"}`}>{message.text}</p>
      ) : null}

      <nav className="tabs" aria-label="编辑分区">
        <button
          type="button"
          className={tab === "dynasties" ? "active" : ""}
          onClick={() => setTab("dynasties")}
        >
          dynasties.json
        </button>
        <button
          type="button"
          className={tab === "dramas" ? "active" : ""}
          onClick={() => setTab("dramas")}
        >
          dramas.json
        </button>
      </nav>

      <div className="editor-wrap">
        {tab === "dynasties" ? (
          <textarea
            spellCheck={false}
            value={dynastiesJson}
            onChange={(e) => onChangeDyn(e.target.value)}
            placeholder='[{"id":"qin",...}]'
          />
        ) : (
          <textarea
            spellCheck={false}
            value={dramasJson}
            onChange={(e) => onChangeDram(e.target.value)}
            placeholder='[{"id":"foo",...}]'
          />
        )}
      </div>
    </>
  );
}
