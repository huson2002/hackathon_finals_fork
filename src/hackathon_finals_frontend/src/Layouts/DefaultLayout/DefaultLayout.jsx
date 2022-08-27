import Footer from '../Footer/Footer'
import Navbar from '../Navbar/Navbar'
import styled from 'styled-components'
import { useContext } from 'react'
import { Context } from '../../hooks/index'
import { Spin } from "antd"

function DefaultLayout({ children }) {
  const { isLoaded } = useContext(Context)

  return (
    <>
      {isLoaded ? (
        <div>
          <Navbar />
          <Body className="container-fluid pe-0 ps-0">{children}</Body>
          <Footer />
        </div>
      ) : (
        <div className="vh-100 vw-100 d-flex justify-content-center align-items-center">
          <Spin/>
        </div>
      )}
    </>
  )
}

export default DefaultLayout

const Body = styled.div`
  min-height: calc(100vh - 60px - 150px);
  background: #222232;
  padding-bottom: 30px;
`
const Loader = styled.div`
  
`;