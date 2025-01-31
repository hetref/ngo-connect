import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const MemberInvitation = ({
  verificationCode,
  ngoId,
  ngoName,
  verificationLink,
}) => {
  // const formattedDate = new Intl.DateTimeFormat("en", {
  //   dateStyle: "long",
  //   timeStyle: "short",
  // }).format(loginDate);

  return (
    <Html>
      <Head />
      <Preview>Member Invite | NGO Connect</Preview>
      <Body style={main}>
        <Container>
          <Section style={content}>
            <Row style={{ ...boxInfos, paddingBottom: "0" }}>
              <Column>
                <Heading
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Hi Member,
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  You&apos;ve got a new invitation from a NGO Connect
                </Heading>
                <Text style={paragraph}>
                  <b>Ngo Name: </b>
                  {ngoName}
                </Text>
                <Text style={paragraph}>
                  <b>Ngo ID: </b>
                  {ngoId}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Verification Code: </b> {verificationCode}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Registration Link: </b>
                  {verificationLink}
                </Text>
                {/* <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Invitation Sent Time: </b>
                  {formattedDate}
                </Text> */}
              </Column>
            </Row>
          </Section>

          <Section style={containerImageFooter}>
            <Img
              style={image}
              width={620}
              src="https://aryanshinde.in/email-footer.png"
            />
          </Section>

          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgb(0,0,0, 0.7)",
            }}
          >
            © {new Date().getFullYear()} | NGO Connect | Member Invitation |
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#fff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
};

const logo = {
  padding: "30px 20px",
};

const containerButton = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const button = {
  backgroundColor: "#e00707",
  borderRadius: 3,
  color: "#FFF",
  fontWeight: "bold",
  border: "1px solid rgb(0,0,0, 0.1)",
  cursor: "pointer",
  padding: "12px 30px",
};

const content = {
  border: "1px solid rgb(0,0,0, 0.1)",
  borderRadius: "3px",
  overflow: "hidden",
};

const image = {
  maxWidth: "100%",
};

const boxInfos = {
  padding: "20px",
};

const containerImageFooter = {
  padding: "45px 0 0 0",
};
