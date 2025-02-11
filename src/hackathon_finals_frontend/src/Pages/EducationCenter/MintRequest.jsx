import { useEffect, useState, useRef } from 'react'
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { Table, Button, Space, Modal, Form, Input } from 'antd'
import styled from 'styled-components'
import axios from 'axios'
import { formatDate, bufferToURI, formatDay } from '../../Utils/format'
import { useConnect, useCanister } from '@connect2ic/react'
import './MintRequest.scss'
import { storeFiles } from '../../Utils/web3Storage'
// import { final_be } from '../../../../declarations/final_be'
// import { nftCanister } from '../../../../declarations/nftCanister'
import { Principal } from '@dfinity/principal'
import { toast } from 'react-toastify'

function MintRequest() {
  const [nftCanister] = useCanister('nftCanister')
  const toastId = useRef(null)
  const { principal } = useConnect()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [requests, setRequests] = useState([])
  const [requestsFilter, setRequestsFilter] = useState([])
  const [requestModal, setRequestModal] = useState({})
  const [isModalConfirmVisible, setIsModalConfirmVisible] = useState(false)
  const [idRejected, setIdRejected] = useState('')

  useEffect(() => {
    getAllRequests()
  }, [])

  const getAllRequests = async () => {
    const resFirst = await axios.get(
      `${process.env.BACKEND_OFF_HEROKU}/education?principal=${principal}`
    )
    console.log(resFirst)
    const educationId = resFirst?.data?.education[0]?._id
    console.log('educationID: ' + educationId)
    const res = await axios.get(
      `${process.env.BACKEND_OFF_HEROKU}/request?status=pending&educationId=${educationId}`
    )
    const request = res?.data?.request
    // const request = res?.data?.request.filter(data => {
    //   data?.education?._id === educationId
    // })
    console.log(request)
    const filtered = request.map(request => {
      const newRequest = {
        ...request,
        key: request._id,
        createdAt: formatDate(new Date(request.createdAt)),
        actions: ['preview', 'delete'],
      }
      return newRequest
    })
    setRequestsFilter(filtered)
    console.log(filtered)
  }

  const columns = [
    {
      title: 'Student ID',
      dataIndex: 'studentID',
      key: 'studentID',
    },
    {
      title: 'Full Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Create At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      dataIndex: 'actions',
      render: (_, { actions }) => (
        <Space size={8}>
          {actions.map((action, index) => {
            if (action === 'preview')
              return (
                <Button
                  type="primary"
                  onClick={showModal}
                  icon={<EyeOutlined />}
                  className="mr-3"
                  key={index}
                ></Button>
              )
            else
              return (
                <Button
                  type="danger"
                  key={index}
                  icon={<DeleteOutlined />}
                  onClick={e =>
                    showModalConfirm(
                      e.currentTarget.parentElement.parentElement.parentElement
                        .parentElement.dataset.rowKey
                    )
                  }
                ></Button>
              )
          })}
        </Space>
      ),
    },
  ]

  // MODAL MODULE
  const showModal = e => {
    const id =
      e.currentTarget.parentElement.parentElement.parentElement.parentElement
        .dataset.rowKey
    const request = requestsFilter.find(req => req._id === id)
    setRequestModal(request)
    setIsModalVisible(true)
  }

  const showModalConfirm = async id => {
    setIdRejected(id)
    setIsModalConfirmVisible(true)
  }

  const handleConfirmOk = async () => {
    rejectRequest(idRejected)
    setIdRejected('')
    setIsModalConfirmVisible(false)
  }

  const handleConfirmCancel = () => {
    setIdRejected('')
    setIsModalConfirmVisible(false)
  }

  const handleOk = async () => {
    console.log(requestModal)

    toastId.current = toast('Minting...', {
      icon: '🚀',
      autoClose: false,
    })
    const base64 = bufferToURI(requestModal?.imageNFT)
    const fileName =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    const ext = requestModal?.imageNFT?.contentType.split('/')[1]
    console.log(fileName)

    const res = await fetch(base64)
    const blob = await res.blob()
    const imgFile = new File([blob], `${fileName}.${ext}`, {
      type: requestModal?.imageNFT?.contentType,
    })

    console.log(imgFile)
    mintNFT(imgFile)

    // After receive cid, post link image to data and post to db

    // setIsModalVisible(false)
  }
  const mintNFT = async fileImg => {
    console.log('Minting')
    const cid = await storeFiles([fileImg])
    // const cid = 'bafybeiagkizddtmt4cubpjsatybhs3dhkmf2g3n527h7u6foawb3fhzro4'
    const fileNameImg = fileImg.name
    const tokenURI = `https://${cid}.${process.env.IPFS_LINK}/${fileNameImg}`
    const { name, education, studentID, nationID, dob, certificate, _id } =
      requestModal
    const metadata = {
      id: '',
      cid: tokenURI,
      center: '',
      name: '',
      cer_owner: '',
    }
    const ownerPrincipal = requestModal.principal
    const resCanister = await nftCanister.mintDip721(
      // Principal.fromText(principal),
      Principal.fromText(ownerPrincipal),
      metadata
    )
    console.log(resCanister)
    console.log('store canister')
    if (Object.keys(resCanister)[0] !== 'Ok') {
      toast.error('Mint fail')
      console.log('error')
    } else {
      const tokenID = Number(resCanister?.Ok?.token_id)
      const data = {
        education: education._id,
        studentID,
        nationID,
        dob,
        tokenID,
        name: certificate,
        cer_owner: name,
        imgURI: tokenURI,
        image: fileImg,
      }
      const formData = new FormData()
      for (let key in data) {
        formData.append(key, data[key])
      }
      const res = await axios.post(
        `${process.env.BACKEND_OFF_HEROKU}/nft`,
        formData
      )
      console.log('store db')
      if (res.status === 201) {
        await axios.patch(`${process.env.BACKEND_OFF_HEROKU}/request/${_id}`, {
          status: 'approved',
        })
        console.log('change request db')
        getAllRequests()
      } else {
        toast.error('Mint fail')
        console.log('error')
      }
      toast.dismiss(toastId.current)
      toast.success('Mint successfully')
      console.log('success')
    }
    setIsModalVisible(false)
    console.log('Minted')
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const rejectRequest = async id => {
    const res = await axios.patch(
      `${process.env.BACKEND_OFF_HEROKU}/request/${id}`,
      {
        status: 'rejected',
      }
    )
    console.log(res)
    getAllRequests()
    if (res.status === 200) {
      console.log('success')
      toast.success('Reject successfully')
    } else {
      console.log('error')
      toast.error('Reject fail')
    }
  }

  return (
    <div className="pt-5">
      <h2 className="my-4 mt-0 text-white text-center heading1">
        MINT REQUESTS
      </h2>
      <Table
        columns={columns}
        dataSource={requestsFilter}
        style={{ margin: '0 auto' }}
      />

      <Modal
        title="User KYC to mint NFT"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={900}
      >
        <div className="d-flex justify-content-between row">
          <Form
            encType="multipart/form-data"
            style={{ maxWidth: '60vw', margin: '0px auto' }}
            labelCol={{ span: 9 }}
            wrapperCol={{ span: 20 }}
            disabled
            className="col-7"
          >
            <Form.Item label="Full name" name="name">
              <Input type="text" id="name" placeholder={requestModal.name} />
            </Form.Item>

            <Form.Item label="Date of Birth" name="dob">
              <Input placeholder={formatDay(requestModal.dob)} />
            </Form.Item>

            <Form.Item label="Education center" name="educationCenter">
              <Input placeholder={requestModal?.education?.name} />
            </Form.Item>

            <Form.Item label="Nation ID Number" name="nationIdNumber">
              <Input placeholder={requestModal.nationID} />
            </Form.Item>

            <Form.Item label="Student ID" name="studentId">
              <Input placeholder={requestModal.studentID} />
            </Form.Item>

            <Form.Item label="Name of Certificate" name="nameOfCertificate">
              <Input placeholder={requestModal.certificate} />
            </Form.Item>
          </Form>

          <Form
            labelCol={{ span: 12 }}
            wrapperCol={{ span: 20 }}
            disabled
            className="col-5 ml-4"
          >
            <Form.Item label="KYC Image" name="imageKYC" className="mx-4">
              <Container className="wrap_img mb-4">
                {requestModal?.imageKYC && ( // render image if exist, replace false by uri
                  <img
                    src={bufferToURI(requestModal?.imageKYC)}
                    alt="preview image"
                    srcSet=""
                  />
                )}
              </Container>
            </Form.Item>
            <Form.Item label="Certificate Image" name="file" className="mx-4">
              <Container className="wrap_img">
                {requestModal?.imageKYC && ( // render image if exist, replace false by uri
                  <img
                    src={bufferToURI(requestModal?.imageNFT)}
                    alt="preview image"
                    srcSet=""
                  />
                )}
              </Container>
            </Form.Item>
          </Form>
        </div>
      </Modal>
      <>
        <Modal
          title="NOTIFICATION"
          visible={isModalConfirmVisible}
          onOk={handleConfirmOk}
          onCancel={handleConfirmCancel}
          okText="Reject"
        >
          <p>Do you reject this request?</p>
        </Modal>
      </>
    </div>
  )
}

export default MintRequest

const Container = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 1px dashed #ccc;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`
