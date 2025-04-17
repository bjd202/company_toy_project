import { getUser } from "~/utils/auth.server";

import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한글 요일 출력을 위해 로드
import { db } from "~/lib/db";
import { eq } from "drizzle-orm";
import { quoteCache, quotes } from "drizzle/schema";
import { parseStringPromise } from "xml2js";
dayjs.locale("ko");

async function getQuote() {
  const today = dayjs().format("YYYY-MM-DD");
  // 1. 오늘 캐시 확인
  const cached = await db.query.quoteCache.findFirst({
    where: eq(quoteCache.date, today),
    with: {
      quote: true, // join quotes
    },
  });

  if (cached?.quote) {
    return { quote: cached.quote.text, source: "cache" };
  }

  // 2. 랜덤 명언 하나 뽑기
  const allQuotes = await db.select().from(quotes);
  const random = allQuotes[Math.floor(Math.random() * allQuotes.length)];

  // 3. 캐시에 저장
  await db.insert(quoteCache).values({
    date: today,
    quoteId: random.id,
  });

  return { quote: random.text, source: "random" };
}

async function getHeadline() {
  const res = await fetch("https://www.mk.co.kr/rss/30000001/");
  const xml = await res.text();

  const parsed = await parseStringPromise(xml);
  const items = parsed.rss.channel[0].item;

  const news = items.slice(0, 10).map((item) => ({
    title: item.title[0],
    link: item.link[0],
    date: dayjs(item.pubDate[0]).format("YYYY-MM-DD HH:mm:ss dddd"),
  }));
  console.log(news);

  return news;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request); // 없으면 자동 redirect

  // 날씨
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", "Seoul");
  url.searchParams.set("appid", process.env.WEATHER_API_KEY!);
  url.searchParams.set("units", "metric"); // 섭씨
  url.searchParams.set("lang", "kr"); // 한글

  const res = await fetch(url.toString());
  const weather = await res.json();

  // 미세먼지지
  const pm_url = new URL(
    "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty"
  );
  pm_url.searchParams.set("stationName", "금천구");
  pm_url.searchParams.set("dataTerm", "DAILY");
  pm_url.searchParams.set("returnType", "json");
  pm_url.searchParams.set("numOfRows", "1");
  pm_url.searchParams.set("pageNo", "1");
  pm_url.searchParams.set("serviceKey", process.env.AIR_API_KEY!);

  const pm_res = await fetch(pm_url.toString());
  const pm_json = await pm_res.json();

  const pm = pm_json.response.body.items[0];

  // 명언
  const quote = await getQuote();

  // 매일경제 헤드라인
  const news = await getHeadline();

  return Response.json({ user, weather, pm, quote, news });
}

export default function DashboardPage() {
  const { user, weather, pm, quote, news } = useLoaderData<typeof loader>();

  const dt = weather.dt;
  const city = weather.name;
  const temp = weather.main.temp;
  const temp_min = weather.main.temp_min;
  const temp_max = weather.main.temp_max;
  const wind_speed = weather.wind.speed;
  const icon = weather.weather[0].icon;
  const description = weather.weather[0].description;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  const pm10 = pm.pm10Value;
  const pm10Grade = pm.pm10Grade;

  const pm10GradeColors: Record<number, string> = {
    1: "bg-blue-500",
    2: "bg-blue-300",
    3: "bg-orange-400",
    4: "bg-red-400",
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user}/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <div className=" rounded-xl bg-slate-400 shadow-2xl flex items-center justify-center">
              <div className="grid grid-flow-col grid-rows-3 gap-4 items-center justify-center">
                <div className="row-span-3 flex items-center justify-center">
                  <img src={iconUrl} alt="" />
                </div>
                <div className="col-span-2 p-2 font-bold text-white text-center">
                  {dayjs.unix(dt).format("YYYY년 MM월 DD일 dddd")}
                </div>
                <div className="col-span-2 row-span-2 p-2">
                  <div className="flex flex-col gap-2 text-center">
                    <div className="text-4xl">{temp} °C</div>
                    <div>
                      {temp_max} / {temp_min} °C
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl shadow-2xl ${pm10GradeColors[pm10Grade]}`}
            >
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold p-4 text-white">
                    미세먼지
                  </div>
                  <div className="text-5xl p-4 text-white">{pm10}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-2xl bg-black p-4 col-span-2 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-2xl p-2 text-white">
                  오늘의 명언
                </div>
                <p className="text-white text-base font-bold">
                  {quote.quote || "명언을 불러올 수 없습니다."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-4 space-y-2">
            <h2 className="text-lg font-bold">📰 오늘의 뉴스</h2>
            <div className="flex">
              <div className="flex-1">
                <ul className="list-disc ml-4 text-lg text-gray-700 space-y-1">
                  {news.slice(0, 5).map((n, i) => (
                    <li key={i}>
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {n.title}
                      </a>
                      <div className="text-sm text-gray-400">{n.date}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1">
                <ul className="list-disc ml-4 text-lg text-gray-700 space-y-1">
                  {news.slice(5, 10).map((n, i) => (
                    <li key={i}>
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {n.title}
                      </a>
                      <div className="text-sm text-gray-400">{n.date}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="min-h-[100vh] flex-1 rounded-xl shadow-2xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
