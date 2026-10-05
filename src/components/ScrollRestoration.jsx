import { useEffect } from "react";
import { useLocation } from "react-router-dom"

const ScrollRestoration = () => {
    const {pathname} = useLocation();
    useEffect(() => {
        const savedScroll = localStorage.getItem(`scrollPosition-${pathname}`);
        if(savedScroll) {
            window.scrollTo(0, parseInt(savedScroll));
        }
        const handleScroll =() => {
            localStorage.setItem(`scrollPosition-${pathname}`, window.scrollY.toString());
        };
        window.addEventListener("scroll" , handleScroll);

        return () => window.removeEventListener("scroll" , handleScroll);
    }, [pathname]);



  return null;
};
export default ScrollRestoration
