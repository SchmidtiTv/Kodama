import { useCallback, useEffect, useState } from "react";

import { API } from "@/shared/api/client.js";

const IPV4_FIRST_ENDPOINT = "/network/ipv4-first";

async function fetchIpv4FirstSetting(options = {}) {
  const res = await fetch(`${API}${IPV4_FIRST_ENDPOINT}`, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export function useIpv4First() {
  const [ipv4First, setIpv4First] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchIpv4FirstSetting()
      .then((data) => {
        if (!cancelled) setIpv4First(!!data.enabled);
      })
      .catch((error) => console.error("[Network] IPv4-first load failed:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleIpv4First = useCallback(
    (enabled) => {
      const previous = ipv4First;
      setIpv4First(enabled);
      fetchIpv4FirstSetting({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
        .then((data) => setIpv4First(!!data.enabled))
        .catch((error) => {
          console.error("[Network] IPv4-first toggle failed:", error);
          setIpv4First(previous);
        });
    },
    [ipv4First]
  );

  return { ipv4First, toggleIpv4First };
}
