import clearCache from './action';
import Basic from './components/Basic'

const getData = async () => {
  const res = await fetch('https://reqres.in/api/users?page=1', {
    method: 'GET',
    next: {
      tags: ['test'],
      revalidate: 3600,
    }
  });
  
  return await res.json();
}

export default async function Home() {
  const data = await getData();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form action={clearCache}>
        <button type="submit" className="bg-red-500 py-4 px-8">Clear page catch</button>
      </form>
      <Basic>
        {JSON.stringify(data)}
      </Basic>
    </main>
  );
}
