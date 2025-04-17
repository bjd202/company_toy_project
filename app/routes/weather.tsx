import { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", "Seoul");
  url.searchParams.set("appid", process.env.WEATHER_API_KEY!);
  url.searchParams.set("units", "metric"); // 섭씨
  url.searchParams.set("lang", "kr"); // 한글
  console.log(url);

  const res = await fetch(url.toString());
  const data = await res.json();
  console.log(data);

  return Response.json(data);
}

export default function WeatherPage() {
  const data = useLoaderData<typeof loader>();
  console.log(data);

//   const {
//     name,
//     main: { temp },
//     weather,
//   } = data;

//   const description = weather[0].description;
//   const icon = weather[0].icon;
//   const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-5">
      <div className="aspect-video rounded-xl bg-muted/50" />
    </div>
  );
}
