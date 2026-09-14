import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ICON_TILE, SERVER_TOOLS } from '../mock';

const ToolCard = ({ tool, index = 0 }) => {
  const navigate = useNavigate();
  const Icon = Icons[tool.icon] || Icons.FileText;
  const isReady = tool.ready || !!SERVER_TOOLS[tool.slug];
  return (
    <button
      onClick={() => navigate(`/tool/${tool.slug}`)}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
      className="card-hover reveal group relative text-left w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5"
    >
      <div className={`grid place-items-center w-12 h-12 rounded-xl ${ICON_TILE[tool.color] || ICON_TILE.rose}`}>
        <Icon className="w-6 h-6" strokeWidth={2} />
      </div>
      <h3 className="mt-4 font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        {tool.name}
        {!isReady && (
          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">soon</span>
        )}
      </h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{tool.desc}</p>
      <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-rose-500 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
        Open tool <Icons.ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};

export default ToolCard;
