import Navbar from "@/components/Misc/Navbar";

const NavbarLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default NavbarLayout;
