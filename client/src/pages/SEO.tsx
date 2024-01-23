import { Helmet } from "react-helmet-async";
import firebaseConfig from '../../../firebase-config.json';
import banner from '../../public/banner.jpg'

const title = "Cards Against Animals";
const description = "Play the infamous card game! Now with cat-dogs and mouse-deer."

/**
 * Renders HTMl metadata to generate previews, e.g. on Discord.
 * 
 * Note: this doesn't actually work in Discord, because it needs to be rendered
 * on the server side.
 * So I use text substitution plugin for Vite to modify index.html directly.
 */
export function SEO() {
  const bannerUrl = window.location.origin + banner;
  return <Helmet>
    <title>{title}</title>
    <meta property="description" content={description} />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description}/>
    <meta property="og:url" content={firebaseConfig.webUrl} />
    <meta property="og:image" content={bannerUrl} />
    <meta property="og:image:width" content="1600" />
    <meta property="og:image:height" content="720" />

    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:image" content={bannerUrl} />
  </Helmet>;
}